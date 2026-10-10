import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { contactGrantId } from '../ids';
import { toTimestamp } from '../time';

/**
 * @typedef {Object} ContactGrantDoc
 * @property {string} doctorId
 * @property {string} repId
 * @property {import('firebase/firestore').Timestamp} grantedAt
 */

const COLLECTION = 'contactGrants';

/**
 * Fetches contact grant document for a doctor-rep pair
 * @param {string} doctorId 
 * @param {string} repId 
 * @returns {Promise<ContactGrantDoc|null>}
 */
export async function getContactGrant(doctorId, repId) {
  if (!doctorId || !repId) return null;
  const id = contactGrantId(doctorId, repId);
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Checks if a rep has been granted WhatsApp/contact access by a doctor
 * @param {string} doctorId 
 * @param {string} repId 
 * @returns {Promise<boolean>}
 */
export async function hasContactGrant(doctorId, repId) {
  const grant = await getContactGrant(doctorId, repId);
  return Boolean(grant);
}

/**
 * Grants contact access to a rep (called by doctor, typically during appointment approval)
 * @param {string} doctorId 
 * @param {string} repId 
 * @returns {Promise<void>}
 */
export async function grantContactAccess(doctorId, repId) {
  if (!doctorId || !repId) throw new Error('doctorId and repId are required');
  const id = contactGrantId(doctorId, repId);
  await setDoc(doc(db, COLLECTION, id), {
    doctorId,
    repId,
    grantedAt: serverTimestamp()
  }, { merge: true });
}

/**
 * Subscribes to contact grant state for a rep
 * @param {string} doctorId 
 * @param {string} repId 
 * @param {(hasGrant: boolean) => void} callback 
 * @returns {() => void}
 */
export function subscribeContactGrant(doctorId, repId, callback) {
  if (!doctorId || !repId) {
    callback(false);
    return () => {};
  }
  const id = contactGrantId(doctorId, repId);
  return onSnapshot(doc(db, COLLECTION, id), (snap) => {
    callback(snap.exists());
  }, () => {
    callback(false);
  });
}
