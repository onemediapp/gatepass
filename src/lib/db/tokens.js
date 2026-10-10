import { doc, getDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * @typedef {Object} TokenDoc
 * @property {string} tokenCode
 * @property {string} appointmentId
 * @property {string} doctorId
 * @property {string} clinicId
 * @property {string} repId
 * @property {string} slotDate yyyy-MM-dd
 * @property {import('firebase/firestore').Timestamp} expiresAt
 * @property {boolean} isUsed
 */

const COLLECTION = 'tokens';

/**
 * Fetches token document by its 6-character code
 * @param {string} tokenCode 
 * @returns {Promise<TokenDoc|null>}
 */
export async function getToken(tokenCode) {
  if (!tokenCode) return null;
  const cleanCode = tokenCode.trim().toUpperCase();
  const snap = await getDoc(doc(db, COLLECTION, cleanCode));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Subscribes to token changes in real-time
 * @param {string} tokenCode 
 * @param {(token: TokenDoc|null) => void} callback 
 * @returns {() => void}
 */
export function subscribeToken(tokenCode, callback) {
  if (!tokenCode) {
    callback(null);
    return () => {};
  }
  const cleanCode = tokenCode.trim().toUpperCase();
  return onSnapshot(doc(db, COLLECTION, cleanCode), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  }, () => {
    callback(null);
  });
}

/**
 * Marks token as used (e.g. at entry/cabin admission)
 * @param {string} tokenCode 
 * @returns {Promise<void>}
 */
export async function markTokenUsed(tokenCode) {
  if (!tokenCode) return;
  const cleanCode = tokenCode.trim().toUpperCase();
  await updateDoc(doc(db, COLLECTION, cleanCode), {
    isUsed: true,
    usedAt: serverTimestamp()
  });
}
