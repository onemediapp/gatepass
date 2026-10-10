import { addDoc, collection, query, where, orderBy, getDocs, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { todayDateStr } from '../time';

/**
 * @typedef {Object} VisitHistoryDoc
 * @property {string} appointmentId
 * @property {string} doctorId
 * @property {string} clinicId
 * @property {string} repId
 * @property {import('./appointments').RepSnapshot} repSnapshot
 * @property {string[]} productsDiscussed
 * @property {string} therapeuticCategory
 * @property {string} visitDate yyyy-MM-dd
 * @property {string} token
 */

const COLLECTION = 'visitHistory';

/**
 * Records a completed visit into the permanent audit history
 * @param {Partial<VisitHistoryDoc>} data 
 * @returns {Promise<string>} history document ID
 */
export async function recordVisitHistory(data) {
  const payload = {
    appointmentId: data.appointmentId || '',
    doctorId: data.doctorId,
    clinicId: data.clinicId || '',
    repId: data.repId,
    repSnapshot: data.repSnapshot || {},
    productsDiscussed: Array.isArray(data.productsDiscussed) ? data.productsDiscussed : [],
    therapeuticCategory: data.therapeuticCategory || '',
    visitDate: data.visitDate || todayDateStr(),
    token: data.token || '',
    createdAt: serverTimestamp()
  };
  const docRef = await addDoc(collection(db, COLLECTION), payload);
  return docRef.id;
}

/**
 * Lists visit history records for a doctor (ordered by visitDate DESC)
 * @param {string} doctorId 
 * @returns {Promise<Array<VisitHistoryDoc & { id: string }>>}
 */
export async function listVisitsForDoctor(doctorId) {
  if (!doctorId) return [];
  const q = query(
    collection(db, COLLECTION),
    where('doctorId', '==', doctorId),
    orderBy('visitDate', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Lists visit history records for a rep (ordered by visitDate DESC)
 * @param {string} repId 
 * @returns {Promise<Array<VisitHistoryDoc & { id: string }>>}
 */
export async function listVisitsForRep(repId) {
  if (!repId) return [];
  const q = query(
    collection(db, COLLECTION),
    where('repId', '==', repId),
    orderBy('visitDate', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Subscribes to visit history for a doctor
 * @param {string} doctorId 
 * @param {(visits: Array<VisitHistoryDoc & { id: string }>) => void} callback 
 * @returns {() => void}
 */
export function subscribeVisitsForDoctor(doctorId, callback) {
  if (!doctorId) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, COLLECTION),
    where('doctorId', '==', doctorId),
    orderBy('visitDate', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.error('subscribeVisitsForDoctor error:', err);
    callback([]);
  });
}
