import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { dayLedgerId } from '../ids';

/**
 * @typedef {Object} DayLedgerDoc
 * @property {string} doctorId
 * @property {string} slotDate yyyy-MM-dd
 * @property {number} approvedCount
 */

const COLLECTION = 'dayLedger';

/**
 * Fetches day ledger for a doctor on a given date
 * @param {string} doctorId 
 * @param {string} slotDate yyyy-MM-dd
 * @returns {Promise<DayLedgerDoc|null>}
 */
export async function getDayLedger(doctorId, slotDate) {
  if (!doctorId || !slotDate) return null;
  const id = dayLedgerId(doctorId, slotDate);
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Subscribes to day ledger for a doctor on a given date
 * @param {string} doctorId 
 * @param {string} slotDate 
 * @param {(count: number) => void} callback 
 * @returns {() => void}
 */
export function subscribeDayLedger(doctorId, slotDate, callback) {
  if (!doctorId || !slotDate) {
    callback(0);
    return () => {};
  }
  const id = dayLedgerId(doctorId, slotDate);
  return onSnapshot(doc(db, COLLECTION, id), (snap) => {
    callback(snap.exists() ? (snap.data().approvedCount || 0) : 0);
  }, () => {
    callback(0);
  });
}
