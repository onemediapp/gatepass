import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { repRelationId } from '../ids';
import { toTimestamp } from '../time';

/**
 * @typedef {Object} RepRelationDoc
 * @property {string} doctorId
 * @property {string} repId
 * @property {boolean} preferred
 * @property {boolean} blocked
 * @property {number} metCount
 * @property {number} noShowCount
 * @property {string} notes
 * @property {import('firebase/firestore').Timestamp} updatedAt
 */

const COLLECTION = 'repRelations';

/**
 * Fetches doctor's private relationship record for a rep
 * @param {string} doctorId 
 * @param {string} repId 
 * @returns {Promise<RepRelationDoc|null>}
 */
export async function getRepRelation(doctorId, repId) {
  if (!doctorId || !repId) return null;
  const id = repRelationId(doctorId, repId);
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Creates or updates relationship record
 * @param {string} doctorId 
 * @param {string} repId 
 * @param {Partial<RepRelationDoc>} data 
 * @returns {Promise<void>}
 */
export async function setRepRelation(doctorId, repId, data) {
  if (!doctorId || !repId) throw new Error('doctorId and repId are required');
  const id = repRelationId(doctorId, repId);
  await setDoc(doc(db, COLLECTION, id), {
    doctorId,
    repId,
    preferred: Boolean(data.preferred),
    blocked: Boolean(data.blocked),
    metCount: Number(data.metCount || 0),
    noShowCount: Number(data.noShowCount || 0),
    notes: data.notes || '',
    updatedAt: serverTimestamp()
  }, { merge: true });
}

/**
 * Updates specific fields on a relationship record
 * @param {string} doctorId 
 * @param {string} repId 
 * @param {Partial<RepRelationDoc>} updates 
 * @returns {Promise<void>}
 */
export async function updateRepRelation(doctorId, repId, updates) {
  if (!doctorId || !repId) return;
  const id = repRelationId(doctorId, repId);
  await setDoc(doc(db, COLLECTION, id), {
    ...updates,
    doctorId,
    repId,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

/**
 * Increments met or no_show count for a rep
 * @param {string} doctorId 
 * @param {string} repId 
 * @param {'met'|'no_show'} outcome 
 */
export async function recordRepOutcome(doctorId, repId, outcome) {
  if (!doctorId || !repId || !outcome) return;
  const id = repRelationId(doctorId, repId);
  const updates = {
    doctorId,
    repId,
    updatedAt: serverTimestamp()
  };
  if (outcome === 'met') {
    updates.metCount = increment(1);
  } else if (outcome === 'no_show') {
    updates.noShowCount = increment(1);
  }
  await setDoc(doc(db, COLLECTION, id), updates, { merge: true });
}

/**
 * Subscribes to a single relationship record
 * @param {string} doctorId 
 * @param {string} repId 
 * @param {(relation: (RepRelationDoc & { id: string })|null) => void} callback 
 * @returns {() => void}
 */
export function subscribeRepRelation(doctorId, repId, callback) {
  if (!doctorId || !repId) {
    callback(null);
    return () => {};
  }
  const id = repRelationId(doctorId, repId);
  return onSnapshot(doc(db, COLLECTION, id), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  }, () => {
    callback(null);
  });
}

/**
 * Subscribes to all relations for a doctor
 * @param {string} doctorId 
 * @param {(relations: Array<RepRelationDoc & { id: string }>) => void} callback 
 * @returns {() => void}
 */
export function subscribeDoctorRepRelations(doctorId, callback) {
  if (!doctorId) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, COLLECTION), where('doctorId', '==', doctorId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(list);
  }, (err) => {
    console.error('subscribeDoctorRepRelations error:', err);
    callback([]);
  });
}

/**
 * Adds a tag to rep relation (max 8 tags)
 * @param {string} doctorId 
 * @param {string} repId 
 * @param {string} tag 
 */
export async function addRepRelationTag(doctorId, repId, tag) {
  if (!doctorId || !repId || !tag) return;
  const rel = await getRepRelation(doctorId, repId);
  const existingTags = Array.isArray(rel?.tags) ? rel.tags : [];
  if (!existingTags.includes(tag)) {
    await updateRepRelation(doctorId, repId, {
      tags: [...existingTags, tag].slice(0, 8)
    });
  }
}
