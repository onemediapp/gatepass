import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * @typedef {Object} DoctorClinicDoc
 * @property {string} doctorId
 * @property {string} clinicId
 * @property {boolean} isActive
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

const COLLECTION = 'doctorClinics';

/**
 * Links a doctor to a clinic
 * @param {string} doctorId 
 * @param {string} clinicId 
 * @returns {Promise<string>} junctionId
 */
export async function linkDoctorClinic(doctorId, clinicId) {
  if (!doctorId || !clinicId) throw new Error('doctorId and clinicId are required');
  const id = `${doctorId}_${clinicId}`;
  await setDoc(doc(db, COLLECTION, id), {
    doctorId,
    clinicId,
    isActive: true,
    createdAt: serverTimestamp()
  }, { merge: true });
  return id;
}

/**
 * Deactivates link between doctor and clinic
 * @param {string} doctorId 
 * @param {string} clinicId 
 * @returns {Promise<void>}
 */
export async function unlinkDoctorClinic(doctorId, clinicId) {
  if (!doctorId || !clinicId) return;
  const id = `${doctorId}_${clinicId}`;
  await updateDoc(doc(db, COLLECTION, id), {
    isActive: false
  });
}

/**
 * Lists all active clinic associations for a doctor
 * @param {string} doctorId 
 * @returns {Promise<Array<DoctorClinicDoc & { id: string }>>}
 */
export async function listClinicsForDoctor(doctorId) {
  if (!doctorId) return [];
  const q = query(
    collection(db, COLLECTION),
    where('doctorId', '==', doctorId),
    where('isActive', '==', true)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Lists all active doctor associations for a clinic
 * @param {string} clinicId 
 * @returns {Promise<Array<DoctorClinicDoc & { id: string }>>}
 */
export async function listDoctorsForClinic(clinicId) {
  if (!clinicId) return [];
  const q = query(
    collection(db, COLLECTION),
    where('clinicId', '==', clinicId),
    where('isActive', '==', true)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Subscribes to clinic links for a doctor
 * @param {string} doctorId 
 * @param {(links: Array<DoctorClinicDoc & { id: string }>) => void} callback 
 * @returns {() => void}
 */
export function subscribeClinicsForDoctor(doctorId, callback) {
  if (!doctorId) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, COLLECTION),
    where('doctorId', '==', doctorId),
    where('isActive', '==', true)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.error('subscribeClinicsForDoctor error:', err);
    callback([]);
  });
}
