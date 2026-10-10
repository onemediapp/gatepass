import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * @typedef {Object} DoctorContactDoc
 * @property {string} whatsappNumber
 * @property {string} [phone]
 */

const COLLECTION = 'doctorContacts';

/**
 * Fetches private contact info for a doctor (if authorized)
 * @param {string} doctorId 
 * @returns {Promise<DoctorContactDoc|null>}
 */
export async function getDoctorContact(doctorId) {
  if (!doctorId) return null;
  try {
    const snap = await getDoc(doc(db, COLLECTION, doctorId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (err) {
    // If not granted, security rules return permission-denied
    return null;
  }
}

/**
 * Sets or updates private contact info for doctor
 * @param {string} doctorId 
 * @param {DoctorContactDoc} data 
 * @returns {Promise<void>}
 */
export async function setDoctorContact(doctorId, data) {
  if (!doctorId) throw new Error('DoctorId is required');
  const docRef = doc(db, COLLECTION, doctorId);
  await setDoc(docRef, {
    whatsappNumber: data.whatsappNumber || '',
    phone: data.phone || ''
  }, { merge: true });
}

/**
 * Subscribes to doctor contact info
 * @param {string} doctorId 
 * @param {(contact: DoctorContactDoc|null) => void} callback 
 * @returns {() => void}
 */
export function subscribeDoctorContact(doctorId, callback) {
  if (!doctorId) {
    callback(null);
    return () => {};
  }
  return onSnapshot(doc(db, COLLECTION, doctorId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  }, (err) => {
    // Permission denied if rep has not been granted contact access
    callback(null);
  });
}
