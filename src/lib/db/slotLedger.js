import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { slotLedgerId } from '../ids';

/**
 * @typedef {Object} SlotLedgerDoc
 * @property {string} doctorId
 * @property {string} slotKey yyyy-MM-dd_HH:mm
 * @property {string} slotDate yyyy-MM-dd
 * @property {number} approvedCount
 */

const COLLECTION = 'slotLedger';

/**
 * Fetches ledger count for a specific doctor slot
 * @param {string} doctorId 
 * @param {string} slotKey 
 * @returns {Promise<SlotLedgerDoc|null>}
 */
export async function getSlotLedger(doctorId, slotKey) {
  if (!doctorId || !slotKey) return null;
  const id = slotLedgerId(doctorId, slotKey);
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Subscribes to all slot ledgers for a doctor on a specific date
 * Useful for the slot picker cinema-seat UI in Phase 6
 * @param {string} doctorId 
 * @param {string} slotDate yyyy-MM-dd
 * @param {(ledgers: Record<string, number>) => void} callback map of slotKey -> approvedCount
 * @returns {() => void}
 */
export function subscribeSlotLedgersForDate(doctorId, slotDate, callback) {
  if (!doctorId || !slotDate) {
    callback({});
    return () => {};
  }
  const q = query(
    collection(db, COLLECTION),
    where('doctorId', '==', doctorId),
    where('slotDate', '==', slotDate)
  );
  return onSnapshot(q, (snap) => {
    const map = {};
    snap.docs.forEach(d => {
      const data = d.data();
      map[data.slotKey] = data.approvedCount || 0;
    });
    callback(map);
  }, (err) => {
    console.error('subscribeSlotLedgersForDate error:', err);
    callback({});
  });
}

/**
 * Fetches slot ledgers for a doctor on a specific date
 * @param {string} doctorId 
 * @param {string} slotDate 
 * @returns {Promise<Record<string, number>>}
 */
export async function getSlotLedgersForDate(doctorId, slotDate) {
  if (!doctorId || !slotDate) return {};
  const q = query(
    collection(db, COLLECTION),
    where('doctorId', '==', doctorId),
    where('slotDate', '==', slotDate)
  );
  const snap = await getDocs(q);
  const map = {};
  snap.docs.forEach(d => {
    const data = d.data();
    map[data.slotKey] = data.approvedCount || 0;
  });
  return map;
}
