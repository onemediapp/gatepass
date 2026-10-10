import { doc, runTransaction, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { slotLedgerId, dayLedgerId, contactGrantId, tokenCandidate } from '../ids';
import { tokenExpiryTimestamp } from '../time';

/**
 * Atomically approves an appointment request:
 * 1. Generates and verifies uniqueness of tokenCode in tokens/
 * 2. Increments slotLedger/{doctorId}_{slotKey}
 * 3. Increments dayLedger/{doctorId}_{yyyy-MM-dd}
 * 4. Updates appointments/{id} to approved
 * 5. Creates tokens/{tokenCode}
 * 6. Creates contactGrants/{doctorId}_{repId} to grant WhatsApp access
 * 
 * @param {Object} params
 * @param {string} params.appointmentId
 * @param {string} params.doctorId
 * @returns {Promise<{ tokenCode: string }>}
 */
export async function approveAppointmentTransaction({ appointmentId, doctorId }) {
  if (!appointmentId || !doctorId) {
    throw new Error('appointmentId and doctorId are required');
  }

  const apptRef = doc(db, 'appointments', appointmentId);

  return await runTransaction(db, async (txn) => {
    const apptSnap = await txn.get(apptRef);
    if (!apptSnap.exists()) {
      throw new Error('Appointment does not exist');
    }

    const appt = apptSnap.data();
    if (appt.doctorId !== doctorId) {
      throw new Error('Unauthorized: Doctor mismatch');
    }
    if (appt.status !== 'pending') {
      throw new Error(`Appointment is already ${appt.status}`);
    }

    // Generate and ensure unique token candidate
    let code = tokenCandidate(6);
    let tokenRef = doc(db, 'tokens', code);
    let tokenSnap = await txn.get(tokenRef);
    let attempts = 0;
    while (tokenSnap.exists() && attempts < 5) {
      code = tokenCandidate(6);
      tokenRef = doc(db, 'tokens', code);
      tokenSnap = await txn.get(tokenRef);
      attempts++;
    }
    if (tokenSnap.exists()) {
      throw new Error('Failed to allocate unique token code. Please retry.');
    }

    // Check slot ledger
    const sLedgerRef = doc(db, 'slotLedger', slotLedgerId(doctorId, appt.slotKey));
    const sLedgerSnap = await txn.get(sLedgerRef);
    const currentSlotCount = sLedgerSnap.exists() ? (sLedgerSnap.data().approvedCount || 0) : 0;

    // Check day ledger
    const dLedgerRef = doc(db, 'dayLedger', dayLedgerId(doctorId, appt.slotDate));
    const dLedgerSnap = await txn.get(dLedgerRef);
    const currentDayCount = dLedgerSnap.exists() ? (dLedgerSnap.data().approvedCount || 0) : 0;

    const expiresAt = tokenExpiryTimestamp(appt.slotDate, appt.slotEnd, 30);

    // 1. Update appointment
    txn.update(apptRef, {
      status: 'approved',
      token: code,
      tokenIssuedAt: serverTimestamp(),
      tokenExpiresAt: expiresAt,
      decidedAt: serverTimestamp()
    });

    // 2. Write tokens document
    txn.set(tokenRef, {
      tokenCode: code,
      appointmentId,
      doctorId,
      clinicId: appt.clinicId,
      repId: appt.repId,
      slotDate: appt.slotDate,
      expiresAt,
      isUsed: false,
      createdAt: serverTimestamp()
    });

    // 3. Write/update slotLedger
    if (!sLedgerSnap.exists()) {
      txn.set(sLedgerRef, {
        doctorId,
        slotKey: appt.slotKey,
        slotDate: appt.slotDate,
        approvedCount: 1
      });
    } else {
      txn.update(sLedgerRef, {
        approvedCount: currentSlotCount + 1
      });
    }

    // 4. Write/update dayLedger
    if (!dLedgerSnap.exists()) {
      txn.set(dLedgerRef, {
        doctorId,
        slotDate: appt.slotDate,
        approvedCount: 1
      });
    } else {
      txn.update(dLedgerRef, {
        approvedCount: currentDayCount + 1
      });
    }

    // 5. Grant contact permissions to rep
    const grantRef = doc(db, 'contactGrants', contactGrantId(doctorId, appt.repId));
    txn.set(grantRef, {
      doctorId,
      repId: appt.repId,
      grantedAt: serverTimestamp()
    }, { merge: true });

    // 6. Update doctor decision stats
    const doctorRef = doc(db, 'doctors', doctorId);
    txn.update(doctorRef, {
      'stats.decisionsCount': increment(1)
    });

    return { tokenCode: code };
  });
}

/**
 * Atomically declines an appointment
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
  const doctorRef = doc(db, 'doctors', doctorId);

  await runTransaction(db, async (txn) => {
    const apptSnap = await txn.get(apptRef);
    if (!apptSnap.exists()) throw new Error('Appointment does not exist');
    const appt = apptSnap.data();
    if (appt.doctorId !== doctorId) throw new Error('Unauthorized');

    txn.update(apptRef, {
      status: 'declined',
      declineReason: declineReason || '',
      decidedAt: serverTimestamp()
    });

    txn.update(doctorRef, {
      'stats.decisionsCount': increment(1)
    });
  });
}
