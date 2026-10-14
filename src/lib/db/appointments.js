import {
  doc, getDoc, setDoc, addDoc, updateDoc, onSnapshot,
  collection, query, where, orderBy, serverTimestamp, runTransaction,
  writeBatch, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { slotKey, slotLedgerId, dayLedgerId } from '../ids';
import { toTimestamp, slotToTimestamps } from '../time';

/**
 * @typedef {Object} RepSnapshot
 * @property {string} name
 * @property {string} company
 * @property {string} designation
 * @property {string} mobile
 * @property {string} therapeuticCategory
 */

/**
 * @typedef {Object} DoctorSnapshot
 * @property {string} name
 * @property {string} specialty
 * @property {string} clinicName
 * @property {string} city
 */

/**
 * @typedef {'pending'|'approved'|'declined'|'cancelled'|'expired'} AppointmentStatus
 */

/**
 * @typedef {Object} AppointmentDoc
 * @property {string} doctorId
 * @property {string} clinicId
 * @property {string} repId
 * @property {RepSnapshot} repSnapshot
 * @property {DoctorSnapshot} doctorSnapshot
 * @property {string} productFocus
 * @property {string} therapeuticCategory
 * @property {string} message
 * @property {boolean} samplesFlag
 * @property {string} [noticeId]
 * @property {string} slotDate yyyy-MM-dd
 * @property {string} slotStart HH:mm
 * @property {string} slotEnd HH:mm
 * @property {string} slotKey yyyy-MM-dd_HH:mm
 * @property {import('firebase/firestore').Timestamp} slotStartAt
 * @property {import('firebase/firestore').Timestamp} slotEndAt
 * @property {AppointmentStatus} status
 * @property {string} [declineReason]
 * @property {string} [token]
 * @property {import('firebase/firestore').Timestamp|null} [tokenIssuedAt]
 * @property {import('firebase/firestore').Timestamp|null} [tokenExpiresAt]
 * @property {import('firebase/firestore').Timestamp|null} [decidedAt]
 * @property {''|'met'|'no_show'} [outcome]
 * @property {import('firebase/firestore').Timestamp|null} [outcomeAt]
 * @property {string} [doctorNotes]
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

const COLLECTION = 'appointments';

/**
 * Fetches an appointment by ID
 * @param {string} id 
 * @returns {Promise<(AppointmentDoc & { id: string })|null>}
 */
export async function getAppointment(id) {
  if (!id) return null;
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Subscribes to real-time changes on an appointment
 * @param {string} id 
 * @param {(appointment: (AppointmentDoc & { id: string })|null) => void} callback 
 * @returns {() => void}
 */
export function subscribeAppointment(id, callback) {
  if (!id) {
    callback(null);
    return () => {};
  }
  return onSnapshot(doc(db, COLLECTION, id), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  }, (err) => {
    console.error('subscribeAppointment error:', err);
    callback(null);
  });
}

/**
 * Creates a new appointment request
 * @param {Partial<AppointmentDoc>} data 
 * @returns {Promise<string>} created appointment ID
 */
export async function createAppointment(data) {
  const { slotDate, slotStart, slotEnd } = data;
  const sKey = data.slotKey || slotKey(slotDate, slotStart);
  const { slotStartAt, slotEndAt } = slotToTimestamps(slotDate, slotStart, slotEnd);

  const payload = {
    doctorId: data.doctorId,
    clinicId: data.clinicId,
    repId: data.repId,
    repSnapshot: {
      name: data.repSnapshot?.name || '',
      company: data.repSnapshot?.company || '',
      designation: data.repSnapshot?.designation || '',
      mobile: data.repSnapshot?.mobile || '',
      therapeuticCategory: data.repSnapshot?.therapeuticCategory || ''
    },
    doctorSnapshot: {
      name: data.doctorSnapshot?.name || '',
      specialty: data.doctorSnapshot?.specialty || '',
      clinicName: data.doctorSnapshot?.clinicName || '',
      city: data.doctorSnapshot?.city || ''
    },
    productFocus: data.productFocus || '',
    therapeuticCategory: data.therapeuticCategory || '',
    visitReason: data.visitReason || '',
    accompaniedBy: data.accompaniedBy || null,
    companyKey: data.companyKey || '',
    message: data.message || '',
    samplesFlag: Boolean(data.samplesFlag),
    noticeId: data.noticeId || '',
    slotDate,
    slotStart,
    slotEnd,
    slotKey: sKey,
    slotStartAt,
    slotEndAt,
    status: 'pending',
    declineReason: '',
    token: '',
    tokenIssuedAt: null,
    tokenExpiresAt: null,
    decidedAt: null,
    outcome: '',
    outcomeAt: null,
    doctorNotes: '',
    rescheduleOf: data.rescheduleOf || '',
    rescheduledTo: data.rescheduledTo || '',
    movedFrom: data.movedFrom || null,
    movedSeenByRep: data.movedSeenByRep ?? true,
    cancelledBy: data.cancelledBy || '',
    cancelReason: data.cancelReason || '',
    cancelledAt: data.cancelledAt || null,
    lateCancel: Boolean(data.lateCancel),
    repConfirmedAt: data.repConfirmedAt || null,
    arrivedAt: data.arrivedAt || null,
    calledInAt: data.calledInAt || null,
    lastChangeAt: data.lastChangeAt ? toTimestamp(data.lastChangeAt) : serverTimestamp(),
    lastChangeBy: data.lastChangeBy || 'rep',
    createdAt: data.createdAt ? toTimestamp(data.createdAt) : serverTimestamp()
  };

  const docRef = await addDoc(collection(db, COLLECTION), payload);
  return docRef.id;
}

/**
 * Checks if a rep already has an active (pending or approved) request with a doctor on a specific slot date
 * @param {string} repId 
 * @param {string} doctorId 
 * @param {string} slotDate yyyy-MM-dd
 * @returns {Promise<(AppointmentDoc & { id: string })|null>}
 */
export async function checkExistingActiveRequest(repId, doctorId, slotDate) {
  if (!repId || !doctorId || !slotDate) return null;
  const q = query(
    collection(db, COLLECTION),
    where('repId', '==', repId),
    where('doctorId', '==', doctorId),
    where('slotDate', '==', slotDate)
  );
  const snap = await getDocs(q);
  const active = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .find(a => ['pending', 'approved'].includes(a.status));
  return active || null;
}

/**
 * Submits an appointment request and links doctor-rep in one atomic batched write
 * @param {Partial<AppointmentDoc>} data 
 * @returns {Promise<string>} created appointment ID
 */
export async function submitAppointmentWithLink(data) {
  const { slotDate, slotStart, slotEnd, doctorId, repId } = data;
  if (!slotDate || !slotStart || !slotEnd || !doctorId || !repId) {
    throw new Error('slotDate, slotStart, slotEnd, doctorId, and repId are required');
  }

  const sKey = data.slotKey || slotKey(slotDate, slotStart);
  const { slotStartAt, slotEndAt } = slotToTimestamps(slotDate, slotStart, slotEnd);

  const batch = writeBatch(db);
  const apptRef = doc(collection(db, COLLECTION));

  const payload = {
    doctorId,
    clinicId: data.clinicId || '',
    repId,
    repSnapshot: {
      name: data.repSnapshot?.name || '',
      company: data.repSnapshot?.company || '',
      designation: data.repSnapshot?.designation || '',
      mobile: data.repSnapshot?.mobile || '',
      therapeuticCategory: data.repSnapshot?.therapeuticCategory || ''
    },
    doctorSnapshot: {
      name: data.doctorSnapshot?.name || '',
      specialty: data.doctorSnapshot?.specialty || '',
      clinicName: data.doctorSnapshot?.clinicName || '',
      city: data.doctorSnapshot?.city || ''
    },
    productFocus: (data.productFocus || '').slice(0, 300),
    therapeuticCategory: data.therapeuticCategory || '',
    visitReason: data.visitReason || '',
    accompaniedBy: data.accompaniedBy || null,
    companyKey: data.companyKey || '',
    message: (data.message || '').slice(0, 500),
    samplesFlag: Boolean(data.samplesFlag),
    noticeId: data.noticeId || '',
    slotDate,
    slotStart,
    slotEnd,
    slotKey: sKey,
    slotStartAt,
    slotEndAt,
    status: 'pending',
    declineReason: '',
    token: '',
    tokenIssuedAt: null,
    tokenExpiresAt: null,
    decidedAt: null,
    outcome: '',
    outcomeAt: null,
    doctorNotes: '',
    rescheduleOf: data.rescheduleOf || '',
    rescheduledTo: data.rescheduledTo || '',
    movedFrom: data.movedFrom || null,
    movedSeenByRep: data.movedSeenByRep ?? true,
    cancelledBy: data.cancelledBy || '',
    cancelReason: data.cancelReason || '',
    cancelledAt: data.cancelledAt || null,
    lateCancel: Boolean(data.lateCancel),
    repConfirmedAt: data.repConfirmedAt || null,
    arrivedAt: data.arrivedAt || null,
    calledInAt: data.calledInAt || null,
    lastChangeAt: data.lastChangeAt ? toTimestamp(data.lastChangeAt) : serverTimestamp(),
    lastChangeBy: data.lastChangeBy || 'rep',
    createdAt: data.createdAt ? toTimestamp(data.createdAt) : serverTimestamp()
  };

  batch.set(apptRef, payload);

  const linkId = `${doctorId}_${repId}`;
  const linkRef = doc(db, 'doctorRepLinks', linkId);
  batch.set(linkRef, {
    doctorId,
    repId,
    firstContactAt: serverTimestamp()
  }, { merge: true });

  await batch.commit();
  return apptRef.id;
}

/**
 * Updates an appointment
 * @param {string} id 
 * @param {Partial<AppointmentDoc>} updates 
 * @returns {Promise<void>}
 */
export async function updateAppointment(id, updates) {
  if (!id) return;
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, updates);
}

/**
 * Subscribes to pending appointment requests for a doctor (ordered by slotStartAt)
 * @param {string} doctorId 
 * @param {(appointments: Array<AppointmentDoc & { id: string }>) => void} callback 
 * @returns {() => void}
 */
export function subscribeDoctorPendingAppointments(doctorId, callback) {
  if (!doctorId) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, COLLECTION),
    where('doctorId', '==', doctorId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.error('subscribeDoctorPendingAppointments error:', err);
    callback([]);
  });
}

/**
 * Subscribes to appointments for a doctor by slot date and status
 * @param {string} doctorId 
 * @param {string} slotDate yyyy-MM-dd
 * @param {(appointments: Array<AppointmentDoc & { id: string }>) => void} callback 
 * @returns {() => void}
 */
export function subscribeDoctorAppointmentsByDate(doctorId, slotDate, callback) {
  if (!doctorId || !slotDate) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, COLLECTION),
    where('doctorId', '==', doctorId),
    where('slotDate', '==', slotDate),
    where('status', '==', 'approved')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.error('subscribeDoctorAppointmentsByDate error:', err);
    callback([]);
  });
}

/**
 * Subscribes to all appointments for a doctor
 * @param {string} doctorId 
 * @param {(appointments: Array<AppointmentDoc & { id: string }>) => void} callback 
 * @returns {() => void}
 */
export function subscribeDoctorAppointments(doctorId, callback) {
  if (!doctorId) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, COLLECTION),
    where('doctorId', '==', doctorId)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.error('subscribeDoctorAppointments error:', err);
    callback([]);
  });
}

/**
 * Subscribes to appointments for a rep (ordered by createdAt DESC)
 * @param {string} repId 
 * @param {(appointments: Array<AppointmentDoc & { id: string }>) => void} callback 
 * @returns {() => void}
 */
export function subscribeRepAppointments(repId, callback) {
  if (!repId) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, COLLECTION),
    where('repId', '==', repId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.error('subscribeRepAppointments error:', err);
    callback([]);
  });
}

/**
 * Subscribes to document changes for a rep's appointments for toast notifications
 * @param {string} repId 
 * @param {(change: { type: string, id: string, data: any }) => void} onDocChange 
 * @returns {() => void}
 */
export function subscribeRepAppointmentChanges(repId, onDocChange) {
  if (!repId) return () => {};
  const q = query(
    collection(db, COLLECTION),
    where('repId', '==', repId)
  );
  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      onDocChange({
        type: change.type,
        id: change.doc.id,
        data: change.doc.data()
      });
    });
  }, (err) => {
    console.error('subscribeRepAppointmentChanges error:', err);
  });
}

/**
 * Rep cancels their own appointment
 * If approved, atomics decrement slotLedger, dayLedger, and release token doc
 * @param {string} appointmentId 
 * @param {string} repId 
 */
export async function cancelAppointment(appointmentId, repId) {
  if (!appointmentId) return;
  const apptRef = doc(db, COLLECTION, appointmentId);

  await runTransaction(db, async (txn) => {
    // 1. All reads must occur first
    const snap = await txn.get(apptRef);
    if (!snap.exists()) throw new Error('Appointment not found');
    const data = snap.data();
    if (data.repId !== repId) throw new Error('Unauthorized');
    if (data.status === 'cancelled') return;

    let sSnap = null;
    let dSnap = null;
    let tSnap = null;
    let sLedgerRef = null;
    let dLedgerRef = null;
    let tokenRef = null;

    if (data.status === 'approved') {
      if (data.doctorId && data.slotKey) {
        sLedgerRef = doc(db, 'slotLedger', slotLedgerId(data.doctorId, data.slotKey));
        sSnap = await txn.get(sLedgerRef);
      }
      if (data.doctorId && data.slotDate) {
        dLedgerRef = doc(db, 'dayLedger', dayLedgerId(data.doctorId, data.slotDate));
        dSnap = await txn.get(dLedgerRef);
      }
      if (data.token) {
        const cleanToken = data.token.trim().toUpperCase();
        tokenRef = doc(db, 'tokens', cleanToken);
        tSnap = await txn.get(tokenRef);
      }
    }

    // 2. All writes executed after all reads
    txn.update(apptRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    if (data.status === 'approved') {
      if (sLedgerRef && sSnap && sSnap.exists() && (sSnap.data().approvedCount || 0) > 0) {
        txn.update(sLedgerRef, {
          approvedCount: sSnap.data().approvedCount - 1
        });
      }
      if (dLedgerRef && dSnap && dSnap.exists() && (dSnap.data().approvedCount || 0) > 0) {
        txn.update(dLedgerRef, {
          approvedCount: dSnap.data().approvedCount - 1
        });
      }
      if (tokenRef && tSnap && tSnap.exists()) {
        txn.update(tokenRef, {
          isUsed: true
        });
      }
    }
  });
}

/**
 * Sweeps and marks past pending appointments as expired
 * @param {string} userId doctorId or repId
 * @param {'doctor'|'rep'} role 
 * @returns {Promise<number>} count of expired appointments
 */
export async function sweepExpiredAppointments(userId, role = 'rep') {
  if (!userId) return 0;
  const fieldName = role === 'doctor' ? 'doctorId' : 'repId';
  const q = query(
    collection(db, COLLECTION),
    where(fieldName, '==', userId),
    where('status', '==', 'pending')
  );
  try {
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    let expiredCount = 0;
    const now = Date.now();
    snap.docs.forEach((d) => {
      const data = d.data();
      const startAtMs = data.slotStartAt?.toMillis ? data.slotStartAt.toMillis() : 0;
      if (startAtMs > 0 && startAtMs < now) {
        batch.update(d.ref, {
          status: 'expired',
          lastChangeAt: serverTimestamp(),
          lastChangeBy: 'system'
        });
        expiredCount++;
      }
    });
    if (expiredCount > 0) {
      await batch.commit();
    }
    return expiredCount;
  } catch (err) {
    console.warn('sweepExpiredAppointments error:', err);
    return 0;
  }
}
