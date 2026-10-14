import {
  doc, getDoc, updateDoc, runTransaction, serverTimestamp, collection
} from 'firebase/firestore';
import { db } from '../firebase';
import { makeDoctorToken, slotLedgerId, dayLedgerId, weekLedgerId } from '../ids';
import { parseSlotTimeToDate, toTimestamp, getISOWeekString, tokenExpiryTimestamp } from '../time';

/**
 * Atomically approves an appointment request.
 * Enforces caps: maxRepsPerSlot, maxRepsPerDay, maxRepsPerWeek, and maxPerCompanyPerDay.
 * If appointment is a rescheduleOf an approved appointment, atomically cancels the old visit,
 * decrements its ledgers, and releases its token within the same transaction.
 *
 * @param {Object} params
 * @param {string} params.appointmentId
 * @param {string} params.doctorId
 * @param {number} [params.maxRepsPerSlot=1]
 * @param {number} [params.maxRepsPerDay=3]
 * @param {number} [params.maxRepsPerWeek=0] 0 = disabled
 * @param {number} [params.maxPerCompanyPerDay=1]
 * @returns {Promise<{ tokenCode: string }>}
 */
export async function approveAppointmentTransaction({
  appointmentId,
  doctorId,
  maxRepsPerSlot = 1,
  maxRepsPerDay = 3,
  maxRepsPerWeek = 0,
  maxPerCompanyPerDay = 1
}) {
  if (!appointmentId || !doctorId) {
    throw new Error('appointmentId and doctorId are required');
  }

  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await runTransaction(db, async (tx) => {
        const apptRef = doc(db, 'appointments', appointmentId);

        // Pre-fetch appointment to construct ledger keys
        const apptSnapPre = await tx.get(apptRef);
        if (!apptSnapPre.exists()) throw new Error('ALREADY_DECIDED');
        const apptData = apptSnapPre.data();

        if (apptData.doctorId !== doctorId) throw new Error('Unauthorized');
        if (apptData.status !== 'pending') throw new Error('ALREADY_DECIDED');

        const {
          slotKey, slotDate, slotStart, slotEnd, clinicId,
          repId, repSnapshot, productFocus, therapeuticCategory,
          companyKey, rescheduleOf
        } = apptData;

        const slotRef = doc(db, 'slotLedger', slotLedgerId(doctorId, slotKey));
        const dayRef = doc(db, 'dayLedger', dayLedgerId(doctorId, slotDate));
        const isoWeek = getISOWeekString(slotDate);
        const weekRef = doc(db, 'weekLedger', weekLedgerId(doctorId, isoWeek));

        // Generate 5 candidate tokens: 'RM' + 4 digits
        const candidates = [
          makeDoctorToken(),
          makeDoctorToken(),
          makeDoctorToken(),
          makeDoctorToken(),
          makeDoctorToken()
        ];
        const candRefs = candidates.map(t => doc(db, 'tokens', t));

        // If this is a reschedule of an old appointment, prepare read
        let oldApptRef = null;
        let oldSlotRef = null;
        let oldDayRef = null;
        let oldWeekRef = null;
        let oldTokenRef = null;

        if (rescheduleOf) {
          oldApptRef = doc(db, 'appointments', rescheduleOf);
        }

        // Read all documents in parallel
        const reads = [
          tx.get(slotRef),
          tx.get(dayRef),
          tx.get(weekRef),
          ...candRefs.map(r => tx.get(r))
        ];
        if (oldApptRef) {
          reads.push(tx.get(oldApptRef));
        }

        const [slot, day, week, ...rest] = await Promise.all(reads);
        const cand = rest.slice(0, candRefs.length);
        const oldApptSnap = oldApptRef ? rest[candRefs.length] : null;

        // Quota checks on target slot
        const slotCount = slot.exists() ? (slot.data().approvedCount || 0) : 0;
        const dayData = day.exists() ? day.data() : {};
        const dayCount = dayData.approvedCount || 0;
        const weekCount = week.exists() ? (week.data().approvedCount || 0) : 0;

        if (slotCount >= maxRepsPerSlot) throw new Error('SLOT_FULL');
        if (maxRepsPerDay > 0 && dayCount >= maxRepsPerDay) throw new Error('DAY_FULL');
        if (maxRepsPerWeek > 0 && weekCount >= maxRepsPerWeek) throw new Error('WEEK_FULL');

        // Company check
        const dayCompanies = dayData.companies || {};
        const companyCount = companyKey ? (dayCompanies[companyKey] || 0) : 0;
        if (companyKey && maxPerCompanyPerDay > 0 && companyCount >= maxPerCompanyPerDay) {
          throw new Error('COMPANY_FULL');
        }

        // Candidate token resolution
        const nowMs = Date.now();
        const idx = cand.findIndex(s => {
          if (!s.exists()) return true;
          const tData = s.data();
          if (!tData) return true;
          const expMs = tData.expiresAt?.toMillis ? tData.expiresAt.toMillis() : 0;
          if (tData.isUsed && expMs > 0 && expMs < nowMs) return true;
          if (expMs > 0 && expMs < nowMs - 86400000) return true;
          return false;
        });
        if (idx < 0) throw new Error('TOKEN_RETRY');

        const token = candidates[idx];
        const slotEndPlus30 = tokenExpiryTimestamp(slotDate, slotEnd, 30);
        const slotStartAt = apptData.slotStartAt || toTimestamp(parseSlotTimeToDate(slotDate, slotStart));

        let isSameDayReschedule = false;
        let isSameWeekReschedule = false;

        // 1. If old appointment was approved, handle atomic reschedule swap
        if (oldApptSnap && oldApptSnap.exists()) {
          const oldData = oldApptSnap.data();
          if (oldData.status === 'approved') {
            oldSlotRef = doc(db, 'slotLedger', slotLedgerId(doctorId, oldData.slotKey));
            const oldIsoWeek = getISOWeekString(oldData.slotDate);
            isSameDayReschedule = (oldData.slotDate === slotDate);
            isSameWeekReschedule = (oldIsoWeek === isoWeek);

            const reads = [tx.get(oldSlotRef)];
            if (!isSameDayReschedule) {
              oldDayRef = doc(db, 'dayLedger', dayLedgerId(doctorId, oldData.slotDate));
              reads.push(tx.get(oldDayRef));
            }
            if (!isSameWeekReschedule) {
              oldWeekRef = doc(db, 'weekLedger', weekLedgerId(doctorId, oldIsoWeek));
              reads.push(tx.get(oldWeekRef));
            }

            const results = await Promise.all(reads);
            const oSlot = results[0];
            const oDay = !isSameDayReschedule ? results[1] : null;
            const oWeek = !isSameWeekReschedule ? results[!isSameDayReschedule ? 2 : 1] : null;

            if (oSlot.exists() && (oSlot.data().approvedCount || 0) > 0) {
              tx.update(oldSlotRef, { approvedCount: oSlot.data().approvedCount - 1 });
            }
            if (oldDayRef && oDay?.exists() && (oDay.data().approvedCount || 0) > 0) {
              const oDayCompanies = { ...(oDay.data().companies || {}) };
              if (oldData.companyKey && oDayCompanies[oldData.companyKey]) {
                oDayCompanies[oldData.companyKey] = Math.max(0, oDayCompanies[oldData.companyKey] - 1);
              }
              tx.update(oldDayRef, {
                approvedCount: oDay.data().approvedCount - 1,
                companies: oDayCompanies
              });
            }
            if (oldWeekRef && oWeek?.exists() && (oWeek.data().approvedCount || 0) > 0) {
              tx.update(oldWeekRef, { approvedCount: oWeek.data().approvedCount - 1 });
            }

            // Release old token
            if (oldData.token) {
              oldTokenRef = doc(db, 'tokens', oldData.token.trim().toUpperCase());
              tx.update(oldTokenRef, { isUsed: true });
            }

            // Mark old appointment cancelled by reschedule
            tx.update(oldApptRef, {
              status: 'cancelled',
              cancelledBy: 'rep',
              cancelReason: 'rescheduled',
              cancelledAt: serverTimestamp(),
              rescheduledTo: appointmentId,
              lastChangeAt: serverTimestamp(),
              lastChangeBy: 'rep'
            });
          }
        }

        // 2. Update new appointment
        tx.update(apptRef, {
          status: 'approved',
          token,
          tokenIssuedAt: serverTimestamp(),
          tokenExpiresAt: slotEndPlus30,
          decidedAt: serverTimestamp(),
          lastChangeAt: serverTimestamp(),
          lastChangeBy: 'doctor'
        });

        // 3. Set tokens doc
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

        // 4. Set slotLedger
        tx.set(slotRef, {
          doctorId,
          slotKey,
          slotDate,
          approvedCount: slotCount + 1
        });

        // 5. Set dayLedger with companies map
        const updatedCompanies = { ...dayCompanies };
        if (companyKey) {
          updatedCompanies[companyKey] = isSameDayReschedule ? companyCount : (companyCount + 1);
        }
        tx.set(dayRef, {
          doctorId,
          slotDate,
          approvedCount: isSameDayReschedule ? dayCount : (dayCount + 1),
          companies: updatedCompanies
        });

        // 6. Set weekLedger
        tx.set(weekRef, {
          doctorId,
          isoWeek,
          approvedCount: isSameWeekReschedule ? weekCount : (weekCount + 1)
        });

        // 7. Grant contact permission
        tx.set(doc(db, 'contactGrants', `${doctorId}_${repId}`), {
          doctorId,
          repId,
          grantedAt: serverTimestamp()
        });

        // 8. Record visit history
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

      // Update doctor stats in background
      updateDoctorStatsAfterDecision(doctorId, result.createdAt).catch(console.error);

      return { tokenCode: result.tokenCode };

    } catch (err) {
      if (err.message === 'TOKEN_RETRY' && attempt < 2) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('TOKEN_RETRY');
}

/**
 * Atomically declines an appointment request and grants contact permission if configured
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
      decidedAt: serverTimestamp(),
      lastChangeAt: serverTimestamp(),
      lastChangeBy: 'doctor'
    });

    // Contact grant on decline (WhatsApp after_decision mode)
    if (appt.repId) {
      tx.set(doc(db, 'contactGrants', `${doctorId}_${appt.repId}`), {
        doctorId,
        repId: appt.repId,
        grantedAt: serverTimestamp()
      }, { merge: true });
    }

    return appt.createdAt;
  });

  updateDoctorStatsAfterDecision(doctorId, createdAt).catch(console.error);
}

/**
 * Doctor moves an approved visit to a different open slot in a single atomic transaction
 */
export async function moveAppointmentTransaction({
  appointmentId,
  doctorId,
  newSlotDate,
  newSlotStart,
  newSlotEnd,
  maxRepsPerSlot = 1,
  maxRepsPerDay = 3,
  maxRepsPerWeek = 0
}) {
  if (!appointmentId || !doctorId || !newSlotDate || !newSlotStart || !newSlotEnd) {
    throw new Error('Missing required arguments to move appointment');
  }

  const apptRef = doc(db, 'appointments', appointmentId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(apptRef);
    if (!snap.exists()) throw new Error('Appointment not found');
    const data = snap.data();

    if (data.doctorId !== doctorId) throw new Error('Unauthorized');
    if (data.status !== 'approved') throw new Error('Only approved visits can be moved');

    const oldSlotKey = data.slotKey;
    const oldSlotDate = data.slotDate;
    const oldIsoWeek = getISOWeekString(oldSlotDate);

    const newSlotKey = `${newSlotDate}_${newSlotStart}`;
    const newIsoWeek = getISOWeekString(newSlotDate);

    const oldSlotRef = doc(db, 'slotLedger', slotLedgerId(doctorId, oldSlotKey));
    const oldDayRef = doc(db, 'dayLedger', dayLedgerId(doctorId, oldSlotDate));
    const oldWeekRef = doc(db, 'weekLedger', weekLedgerId(doctorId, oldIsoWeek));

    const newSlotRef = doc(db, 'slotLedger', slotLedgerId(doctorId, newSlotKey));
    const newDayRef = doc(db, 'dayLedger', dayLedgerId(doctorId, newSlotDate));
    const newWeekRef = doc(db, 'weekLedger', weekLedgerId(doctorId, newIsoWeek));

    const tokenRef = data.token ? doc(db, 'tokens', data.token.trim().toUpperCase()) : null;

    // Read all ledgers
    const [
      oldSlot, oldDay, oldWeek,
      newSlot, newDay, newWeek
    ] = await Promise.all([
      tx.get(oldSlotRef), tx.get(oldDayRef), tx.get(oldWeekRef),
      tx.get(newSlotRef), tx.get(newDayRef), tx.get(newWeekRef)
    ]);

    // Check capacity on new slot
    const newSlotCount = newSlot.exists() ? (newSlot.data().approvedCount || 0) : 0;
    const newDayCount = newDay.exists() ? (newDay.data().approvedCount || 0) : 0;
    const newWeekCount = newWeek.exists() ? (newWeek.data().approvedCount || 0) : 0;

    if (newSlotCount >= maxRepsPerSlot) throw new Error('SLOT_FULL');
    if (maxRepsPerDay > 0 && newDayCount >= maxRepsPerDay) throw new Error('DAY_FULL');
    if (maxRepsPerWeek > 0 && newWeekCount >= maxRepsPerWeek) throw new Error('WEEK_FULL');

    // Decrement old ledgers
    if (oldSlot.exists() && (oldSlot.data().approvedCount || 0) > 0) {
      tx.update(oldSlotRef, { approvedCount: oldSlot.data().approvedCount - 1 });
    }
    if (oldDay.exists() && (oldDay.data().approvedCount || 0) > 0) {
      tx.update(oldDayRef, { approvedCount: oldDay.data().approvedCount - 1 });
    }
    if (oldWeek.exists() && (oldWeek.data().approvedCount || 0) > 0) {
      tx.update(oldWeekRef, { approvedCount: oldWeek.data().approvedCount - 1 });
    }

    // Increment new ledgers
    tx.set(newSlotRef, {
      doctorId,
      slotKey: newSlotKey,
      slotDate: newSlotDate,
      approvedCount: newSlotCount + 1
    }, { merge: true });

    tx.set(newDayRef, {
      doctorId,
      slotDate: newSlotDate,
      approvedCount: newDayCount + 1
    }, { merge: true });

    tx.set(newWeekRef, {
      doctorId,
      isoWeek: newIsoWeek,
      approvedCount: newWeekCount + 1
    }, { merge: true });

    // Update token expiry
    const newSlotEndPlus30 = tokenExpiryTimestamp(newSlotDate, newSlotEnd, 30);
    if (tokenRef) {
      tx.update(tokenRef, {
        slotDate: newSlotDate,
        expiresAt: newSlotEndPlus30
      });
    }

    // Update appointment document
    const newStartAt = parseSlotTimeToDate(newSlotDate, newSlotStart);
    const newEndAt = parseSlotTimeToDate(newSlotDate, newSlotEnd);

    tx.update(apptRef, {
      slotDate: newSlotDate,
      slotStart: newSlotStart,
      slotEnd: newSlotEnd,
      slotKey: newSlotKey,
      slotStartAt: toTimestamp(newStartAt),
      slotEndAt: toTimestamp(newEndAt),
      tokenExpiresAt: newSlotEndPlus30,
      movedFrom: {
        slotKey: oldSlotKey,
        slotDate: oldSlotDate,
        slotStart: data.slotStart,
        slotEnd: data.slotEnd,
        movedAt: serverTimestamp()
      },
      movedSeenByRep: false,
      lastChangeAt: serverTimestamp(),
      lastChangeBy: 'doctor'
    });
  });
}

/**
 * Universal cancellation transaction for rep or doctor with multi-ledger decrement and late-cancel tracking
 */
export async function cancelAppointmentTransaction({
  appointmentId,
  userId,
  userRole = 'rep',
  cancelReason = '',
  cancelCutoffMinutes = 60
}) {
  if (!appointmentId || !userId) {
    throw new Error('appointmentId and userId are required');
  }

  const apptRef = doc(db, 'appointments', appointmentId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(apptRef);
    if (!snap.exists()) throw new Error('Appointment not found');
    const data = snap.data();

    if (userRole === 'rep' && data.repId !== userId) throw new Error('Unauthorized');
    if (userRole === 'doctor' && data.doctorId !== userId) throw new Error('Unauthorized');
    if (data.status === 'cancelled') return;

    let isLate = false;
    if (data.status === 'approved' && userRole === 'rep') {
      const startAtMs = data.slotStartAt?.toMillis ? data.slotStartAt.toMillis() : 0;
      if (startAtMs > 0 && startAtMs < (Date.now() + cancelCutoffMinutes * 60000)) {
        isLate = true;
      }
    }

    if (data.status === 'approved') {
      const slotRef = doc(db, 'slotLedger', slotLedgerId(data.doctorId, data.slotKey));
      const dayRef = doc(db, 'dayLedger', dayLedgerId(data.doctorId, data.slotDate));
      const isoWeek = getISOWeekString(data.slotDate);
      const weekRef = doc(db, 'weekLedger', weekLedgerId(data.doctorId, isoWeek));
      const tokenRef = data.token ? doc(db, 'tokens', data.token.trim().toUpperCase()) : null;

      const [sSnap, dSnap, wSnap] = await Promise.all([
        tx.get(slotRef),
        tx.get(dayRef),
        tx.get(weekRef)
      ]);

      if (sSnap.exists() && (sSnap.data().approvedCount || 0) > 0) {
        tx.update(slotRef, { approvedCount: sSnap.data().approvedCount - 1 });
      }
      if (dSnap.exists() && (dSnap.data().approvedCount || 0) > 0) {
        const companies = { ...(dSnap.data().companies || {}) };
        if (data.companyKey && companies[data.companyKey]) {
          companies[data.companyKey] = Math.max(0, companies[data.companyKey] - 1);
        }
        tx.update(dayRef, {
          approvedCount: dSnap.data().approvedCount - 1,
          companies
        });
      }
      if (wSnap.exists() && (wSnap.data().approvedCount || 0) > 0) {
        tx.update(weekRef, { approvedCount: wSnap.data().approvedCount - 1 });
      }
      if (tokenRef) {
        tx.update(tokenRef, { isUsed: true });
      }
    }

    tx.update(apptRef, {
      status: 'cancelled',
      cancelledBy: userRole,
      cancelReason: cancelReason.trim(),
      cancelledAt: serverTimestamp(),
      lateCancel: isLate,
      lastChangeAt: serverTimestamp(),
      lastChangeBy: userRole
    });
  });
}

/**
 * Helper to update doctor stats after decision
 */
async function updateDoctorStatsAfterDecision(doctorId, createdAtTimestamp) {
  try {
    const docRef = doc(db, 'doctors', doctorId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const stats = snap.data().stats || { avgResponseMinutes: 0, decisionsCount: 0 };
    const avg = stats.avgResponseMinutes || 0;
    const n = stats.decisionsCount || 0;

    let minutesSinceCreated = 30;
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
