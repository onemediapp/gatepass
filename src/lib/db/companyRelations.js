import { doc, getDoc, setDoc, onSnapshot, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { companyRelationId } from '../ids';

const COLLECTION = 'companyRelations';

/**
 * @typedef {Object} CompanyRelationDoc
 * @property {string} doctorId
 * @property {string} companyKey
 * @property {string} companyName
 * @property {boolean} blocked
 * @property {string[]} tags
 * @property {string} note
 * @property {boolean} pinNote
 * @property {import('firebase/firestore').Timestamp} updatedAt
 */

export async function getCompanyRelation(doctorId, companyKey) {
  if (!doctorId || !companyKey) return null;
  const id = companyRelationId(doctorId, companyKey);
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function setCompanyRelation(doctorId, companyKey, data) {
  if (!doctorId || !companyKey) return;
  const id = companyRelationId(doctorId, companyKey);
  await setDoc(doc(db, COLLECTION, id), {
    doctorId,
    companyKey,
    ...data,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export function subscribeDoctorCompanyRelations(doctorId, callback) {
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
    console.error('subscribeDoctorCompanyRelations error:', err);
    callback([]);
  });
}
