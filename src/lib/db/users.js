import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { toTimestamp } from '../time';

/**
 * @typedef {Object} UserDoc
 * @property {string} name
 * @property {string} email
 * @property {string} [photoUrl]
 * @property {string} [mobile]
 * @property {Array<'rep'|'doctor'>} role
 * @property {boolean} isActive
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} lastLoginAt
 */

const COLLECTION = 'users';

/**
 * Fetches a user document by UID
 * @param {string} uid 
 * @returns {Promise<UserDoc|null>}
 */
export async function getUser(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, COLLECTION, uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Creates a new user document
 * @param {string} uid 
 * @param {Partial<UserDoc>} data 
 * @returns {Promise<void>}
 */
export async function createUser(uid, data) {
  if (!uid) throw new Error('UID is required to create a user');
  const userRef = doc(db, COLLECTION, uid);
  const payload = {
    name: data.name || '',
    email: (data.email || '').toLowerCase().trim(),
    photoUrl: data.photoUrl || '',
    mobile: data.mobile || '',
    role: data.role || ['rep'],
    isActive: data.isActive !== false,
    createdAt: toTimestamp(data.createdAt || serverTimestamp()),
    lastLoginAt: toTimestamp(data.lastLoginAt || serverTimestamp())
  };
  await setDoc(userRef, payload);
}

/**
 * Updates an existing user document
 * Note: Security rules forbid changing the role array
 * @param {string} uid 
 * @param {Partial<UserDoc>} updates 
 * @returns {Promise<void>}
 */
export async function updateUser(uid, updates) {
  if (!uid) return;
  const userRef = doc(db, COLLECTION, uid);
  await updateDoc(userRef, {
    ...updates,
    lastLoginAt: updates.lastLoginAt ? toTimestamp(updates.lastLoginAt) : serverTimestamp()
  });
}

/**
 * Real-time listener for a user document
 * @param {string} uid 
 * @param {(user: (UserDoc & { id: string })|null) => void} callback 
 * @returns {() => void} Unsubscribe function
 */
export function subscribeUser(uid, callback) {
  if (!uid) {
    callback(null);
    return () => {};
  }
  return onSnapshot(doc(db, COLLECTION, uid), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  }, (err) => {
    console.error('subscribeUser error:', err);
    callback(null);
  });
}
