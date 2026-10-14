import {
  doc, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot,
  collection, query, where, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { toTimestamp } from '../time';

/**
 * @typedef {'looking_for'|'not_accepting'|'closure'|'info'} NoticeType
 */

/**
 * @typedef {Object} NoticeDoc
 * @property {string} doctorId
 * @property {string} [clinicId]
 * @property {NoticeType} type
 * @property {string} title max 80 chars
 * @property {string} body max 240 chars
 * @property {string[]} categories
 * @property {boolean} pinned
 * @property {import('firebase/firestore').Timestamp|null} [expiresAt]
 * @property {boolean} isActive
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

const COLLECTION = 'notices';

/**
 * Fetches notice by ID
 * @param {string} id 
 * @returns {Promise<(NoticeDoc & { id: string })|null>}
 */
export async function getNotice(id) {
  if (!id) return null;
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Creates a new doctor clinic notice
 * @param {Partial<NoticeDoc>} data 
 * @returns {Promise<string>} created notice ID
 */
export async function createNotice(data) {
  const payload = {
    doctorId: data.doctorId,
    clinicId: data.clinicId || '',
    type: data.type || 'info',
    title: (data.title || '').slice(0, 80),
    body: (data.body || '').slice(0, 240),
    categories: Array.isArray(data.categories) ? data.categories : [],
    pinned: Boolean(data.pinned),
    expiresAt: data.expiresAt ? toTimestamp(data.expiresAt) : null,
    isActive: data.isActive !== false,
    createdAt: data.createdAt ? toTimestamp(data.createdAt) : serverTimestamp()
  };
  const docRef = await addDoc(collection(db, COLLECTION), payload);
  return docRef.id;
}

/**
 * Updates an existing notice
 * @param {string} id 
 * @param {Partial<NoticeDoc>} updates 
 * @returns {Promise<void>}
 */
export async function updateNotice(id, updates) {
  if (!id) return;
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, updates);
}

/**
 * Deactivates or deletes a notice
 * @param {string} id 
 * @returns {Promise<void>}
 */
export async function deleteNotice(id) {
  if (!id) return;
  await deleteDoc(doc(db, COLLECTION, id));
}

/**
 * Subscribes to all active notices created by a doctor
 * @param {string} doctorId 
 * @param {(notices: Array<NoticeDoc & { id: string }>) => void} callback 
 * @returns {() => void}
 */
export function subscribeDoctorNotices(doctorId, callback) {
  if (!doctorId) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, COLLECTION),
    where('doctorId', '==', doctorId),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.error('subscribeDoctorNotices error:', err);
    callback([]);
  });
}

/**
 * Subscribes to all active feed notices across the platform (for rep home notices feed)
 * @param {(notices: Array<NoticeDoc & { id: string }>) => void} callback 
 * @returns {() => void}
 */
export function subscribeActiveNotices(callback) {
  const q = query(
    collection(db, COLLECTION),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.error('subscribeActiveNotices error:', err);
    callback([]);
  });
}
