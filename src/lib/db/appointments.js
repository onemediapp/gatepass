import {
  doc, getDoc, setDoc, addDoc, updateDoc, onSnapshot,
  collection, query, where, orderBy, serverTimestamp, runTransaction
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
    createdAt: toTimestamp(data.createdAt || serverTimestamp())
  };

  const docRef = await addDoc(collection(db, COLLECTION), payload);
  return docRef.id;
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
 * If approved, atomics decrement slotLedger
 * @param {string} appointmentId 
 * @param {string} repId 
 */
export async function cancelAppointment(appointmentId, repId) {
  if (!appointmentId) return;
  const apptRef = doc(db, COLLECTION, appointmentId);

  await runTransaction(db, async (txn) => {
    const snap = await txn.get(apptRef);
    if (!snap.exists()) throw new Error('Appointment not found');
    const data = snap.data();
    if (data.repId !== repId) throw new Error('Unauthorized');
    if (data.status === 'cancelled') return;

    txn.update(apptRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp()
    });

    // If it was already approved, decrement the slotLedger per rules
    if (data.status === 'approved' && data.slotKey) {
      const sLedgerRef = doc(db, 'slotLedger', slotLedgerId(data.doctorId, data.slotKey));
      const sSnap = await txn.get(sLedgerRef);
      if (sSnap.exists() && sSnap.data().approvedCount > 0) {
        txn.update(sLedgerRef, {
          approvedCount: sSnap.data().approvedCount - 1
        });
      }
    }
  });
}
