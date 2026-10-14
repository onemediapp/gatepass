import { doc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { weekLedgerId } from '../ids';

const COLLECTION = 'weekLedger';

/**
 * Fetches weekLedger document by doctorId and isoWeek
 * @param {string} doctorId 
 * @param {string} isoWeek e.g. "2026-W44"
 * @returns {Promise<{ id: string, approvedCount: number }|null>}
 */
export async function getWeekLedger(doctorId, isoWeek) {
  if (!doctorId || !isoWeek) return null;
  const id = weekLedgerId(doctorId, isoWeek);
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Subscribes to week ledgers for a doctor
 */
export function subscribeDoctorWeekLedgers(doctorId, callback) {
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
    console.error('subscribeDoctorWeekLedgers error:', err);
    callback([]);
  });
}
