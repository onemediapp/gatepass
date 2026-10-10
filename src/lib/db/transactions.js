/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, runTransaction, serverTimestamp, collection, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { makeDoctorToken } from '../ids';
import { tokenExpiryTimestamp, parseSlotTimeToDate, toTimestamp } from '../time';

/**
 * Atomically approves an appointment request using the exact Phase 8.2 specification.
 * 
 * 1. Reads appointment, slotLedger, dayLedger, and 3 token candidates in parallel within transaction
 * 2. Validates appointment is still pending (throws 'ALREADY_DECIDED')
 * 3. Enforces maxRepsPerSlot (throws 'SLOT_FULL')
 * 4. Enforces maxRepsPerDay (throws 'DAY_FULL')
 * 5. Allocates unused token candidate (throws 'TOKEN_RETRY' if conflict)
 * 6. Atomically writes:
 *    - appointments/{id}: status='approved', token, tokenIssuedAt, tokenExpiresAt, decidedAt
 *    - tokens/{token}: tokenCode, appointmentId, doctorId, clinicId, repId, slotDate, expiresAt, isUsed
 *    - slotLedger/{doctorId}_{slotKey}: approvedCount + 1
 *    - dayLedger/{doctorId}_{slotDate}: approvedCount + 1
 *    - contactGrants/{doctorId}_{repId}: grantedAt
 *    - visitHistory/{newId}: appointmentId, doctorId, clinicId, repId, repSnapshot, productsDiscussed, therapeuticCategory, visitDate, token
 * 
 * @param {Object} params
 * @param {string} params.appointmentId
 * @param {string} params.doctorId
 * @param {number} [params.maxRepsPerSlot=1]
 * @param {number} [params.maxRepsPerDay=3]
 * @returns {Promise<{ tokenCode: string }>}
 */
export async function approveAppointmentTransaction({
  appointmentId,
  doctorId,
  maxRepsPerSlot = 1,
  maxRepsPerDay = 3,
}) {
  if (!appointmentId || !doctorId) {
    throw new Error('appointmentId and doctorId are required');
  }

  // Caller retries up to 3 times on TOKEN_RETRY
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await runTransaction(db, async (tx) => {
        const apptRef = doc(db, 'appointments', appointmentId);

        // Pre-fetch appointment to construct ledger keys if needed
        const apptSnapPre = await tx.get(apptRef);
        if (!apptSnapPre.exists()) throw new Error('ALREADY_DECIDED');
        const apptData = apptSnapPre.data();

        if (apptData.doctorId !== doctorId) throw new Error('Unauthorized');
        if (apptData.status !== 'pending') throw new Error('ALREADY_DECIDED');

        const { slotKey, slotDate, slotStart, slotEnd, clinicId, repId, repSnapshot, productFocus, therapeuticCategory } = apptData;

        const slotRef = doc(db, 'slotLedger', `${doctorId}_${slotKey}`);
        const dayRef = doc(db, 'dayLedger', `${doctorId}_${slotDate}`);

        // Generate 3 candidate tokens: 'RM' + 4 digits
        const candidates = [makeDoctorToken(), makeDoctorToken(), makeDoctorToken()];
        const candRefs = candidates.map(t => doc(db, 'tokens', t));

        // Read all documents in parallel
        const [appt, slot, day, ...cand] = await Promise.all([
          tx.get(apptRef),
          tx.get(slotRef),
          tx.get(dayRef),
          ...candRefs.map(r => tx.get(r))
        ]);

        if (appt.data().status !== 'pending') throw new Error('ALREADY_DECIDED');

        const slotCount = slot.exists() ? (slot.data().approvedCount || 0) : 0;
        const dayCount = day.exists() ? (day.data().approvedCount || 0) : 0;

        if (slotCount >= maxRepsPerSlot) throw new Error('SLOT_FULL');
        if (maxRepsPerDay > 0 && dayCount >= maxRepsPerDay) throw new Error('DAY_FULL');

        const idx = cand.findIndex(s => !s.exists());
        if (idx < 0) throw new Error('TOKEN_RETRY');

        const token = candidates[idx];
        const slotEndPlus30 = tokenExpiryTimestamp(slotDate, slotEnd, 30);
        const slotStartAt = apptData.slotStartAt || toTimestamp(parseSlotTimeToDate(slotDate, slotStart));

        // 1. Update appointment
        tx.update(apptRef, {
          status: 'approved',
          token,
          tokenIssuedAt: serverTimestamp(),
          tokenExpiresAt: slotEndPlus30,
          decidedAt: serverTimestamp()
        });

        // 2. Set tokens doc
        tx.set(candRefs[idx], {
          tokenCode: token,
          appointmentId,
          doctorId,
          clinicId: clinicId || '',
          repId,
          slotDate,
          expiresAt: slotEndPlus30,
          isUsed: false,
          createdAt: serverTimestamp()
        });

        // 3. Set slotLedger
        tx.set(slotRef, {
          doctorId,
          slotKey,
          slotDate,
          approvedCount: slotCount + 1
        });

        // 4. Set dayLedger
        tx.set(dayRef, {
          doctorId,
          slotDate,
          approvedCount: dayCount + 1
        });

        // 5. Grant contact permission
        tx.set(doc(db, 'contactGrants', `${doctorId}_${repId}`), {
          doctorId,
          repId,
          grantedAt: serverTimestamp()
        });

        // 6. Record visit history
        tx.set(doc(collection(db, 'visitHistory')), {
          appointmentId,
          doctorId,
          clinicId: clinicId || '',
          repId,
          repSnapshot: repSnapshot || {},
          productsDiscussed: productFocus ? [productFocus] : [],
          therapeuticCategory: therapeuticCategory || '',
          visitDate: slotStartAt,
          token
        });

        return { tokenCode: token, createdAt: apptData.createdAt };
      });

      // After transaction (separate write): update doctor decision stats
      updateDoctorStatsAfterDecision(doctorId, result.createdAt).catch(console.error);

      return { tokenCode: result.tokenCode };

    } catch (err) {
      if (err.message === 'TOKEN_RETRY' && attempt < 2) {
        lastError = err;
        continue; // Retry with fresh candidate tokens
      }
      throw err;
    }
  }

  throw lastError || new Error('TOKEN_RETRY');
}

/**
 * Atomically declines an appointment request
 * @param {Object} params
 * @param {string} params.appointmentId
 * @param {string} params.doctorId
 * @param {string} [params.declineReason]
 */
export async function declineAppointmentTransaction({ appointmentId, doctorId, declineReason = '' }) {
  if (!appointmentId || !doctorId) {
    throw new Error('appointmentId and doctorId are required');
  }

  const apptRef = doc(db, 'appointments', appointmentId);

  const createdAt = await runTransaction(db, async (tx) => {
    const apptSnap = await tx.get(apptRef);
    if (!apptSnap.exists()) throw new Error('ALREADY_DECIDED');
    const appt = apptSnap.data();

    if (appt.doctorId !== doctorId) throw new Error('Unauthorized');
    if (appt.status !== 'pending') throw new Error('ALREADY_DECIDED');

    tx.update(apptRef, {
      status: 'declined',
      declineReason: declineReason.trim(),
      decidedAt: serverTimestamp()
    });

    return appt.createdAt;
  });

  // After transaction: update doctor decision stats
  updateDoctorStatsAfterDecision(doctorId, createdAt).catch(console.error);
}

/**
 * Helper to update doctor stats after decision (avgResponseMinutes and decisionsCount)
 * @param {string} doctorId 
 * @param {any} createdAtTimestamp 
 */
async function updateDoctorStatsAfterDecision(doctorId, createdAtTimestamp) {
  try {
    const docRef = doc(db, 'doctors', doctorId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const stats = snap.data().stats || { avgResponseMinutes: 0, decisionsCount: 0 };
    const avg = stats.avgResponseMinutes || 0;
    const n = stats.decisionsCount || 0;

    let minutesSinceCreated = 30; // fallback
    if (createdAtTimestamp) {
      const createdMs = createdAtTimestamp.toMillis ? createdAtTimestamp.toMillis() : new Date(createdAtTimestamp).getTime();
      const diffMs = Math.max(0, Date.now() - createdMs);
      minutesSinceCreated = Math.round(diffMs / 60000);
    }

    const newAvg = Math.round((avg * n + minutesSinceCreated) / (n + 1));
    await updateDoc(docRef, {
      'stats.avgResponseMinutes': newAvg,
      'stats.decisionsCount': n + 1,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.error('Failed to update doctor stats:', err);
  }
}
