import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { doctorRepLinkId } from '../ids';

/**
 * @typedef {Object} DoctorRepLinkDoc
 * @property {string} doctorId
 * @property {string} repId
 * @property {import('firebase/firestore').Timestamp} firstContactAt
 */

const COLLECTION = 'doctorRepLinks';

/**
 * Fetches doctor-rep link
 * @param {string} doctorId 
 * @param {string} repId 
 * @returns {Promise<DoctorRepLinkDoc|null>}
 */
export async function getDoctorRepLink(doctorId, repId) {
  if (!doctorId || !repId) return null;
  const id = doctorRepLinkId(doctorId, repId);
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Ensures link exists between doctor and rep (created by rep upon first request)
 * @param {string} doctorId 
 * @param {string} repId 
 * @returns {Promise<void>}
 */
export async function ensureDoctorRepLink(doctorId, repId) {
  if (!doctorId || !repId) throw new Error('doctorId and repId are required');
  const id = doctorRepLinkId(doctorId, repId);
  const docRef = doc(db, COLLECTION, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    await setDoc(docRef, {
      doctorId,
      repId,
      firstContactAt: serverTimestamp()
    });
  }
}

/**
 * Lists all rep links for a doctor
 * @param {string} doctorId 
 * @returns {Promise<Array<DoctorRepLinkDoc & { id: string }>>}
 */
export async function listDoctorRepLinks(doctorId) {
  if (!doctorId) return [];
  const q = query(collection(db, COLLECTION), where('doctorId', '==', doctorId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Lists all doctor links for a rep
 * @param {string} repId 
 * @returns {Promise<Array<DoctorRepLinkDoc & { id: string }>>}
 */
export async function listRepDoctorLinks(repId) {
  if (!repId) return [];
  const q = query(collection(db, COLLECTION), where('repId', '==', repId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

