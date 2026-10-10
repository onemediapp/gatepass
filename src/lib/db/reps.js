import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { toTimestamp } from '../time';

/**
 * @typedef {Object} CompanyHistoryItem
 * @property {string} company
 * @property {string} [division]
 * @property {string} [from]
 * @property {string} [to]
 */

/**
 * @typedef {Object} RepDoc
 * @property {string} uid
 * @property {string} companyName
 * @property {CompanyHistoryItem[]} companyHistory
 * @property {string} division
 * @property {'MR'|'AM'|'RM'|'ZM'|'Hospital Marketing'|'KAM'|'Other'} designation
 * @property {string} therapeuticCategory
 * @property {string} [therapeuticCategory2]
 * @property {string[]} productNames
 * @property {string} [molecules]
 * @property {string[]} [dosageForms]
 * @property {boolean} samplesAvailable
 * @property {string} [companyOffice]
 * @property {string} [medInfoHelpline]
 * @property {number} profileScore
 * @property {import('firebase/firestore').Timestamp} updatedAt
 */

const COLLECTION = 'reps';

/**
 * Fetches a rep profile by UID
 * @param {string} uid 
 * @returns {Promise<RepDoc|null>}
 */
export async function getRep(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, COLLECTION, uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Creates or overwrites a rep profile
 * @param {string} uid 
 * @param {Partial<RepDoc>} data 
 * @returns {Promise<void>}
 */
export async function createRep(uid, data) {
  if (!uid) throw new Error('UID is required to create a rep profile');
  const repRef = doc(db, COLLECTION, uid);
  const payload = {
    uid,
    companyName: data.companyName || '',
    companyHistory: Array.isArray(data.companyHistory) ? data.companyHistory : [],
    division: data.division || '',
    designation: data.designation || 'MR',
    therapeuticCategory: data.therapeuticCategory || '',
    therapeuticCategory2: data.therapeuticCategory2 || '',
    productNames: Array.isArray(data.productNames) ? data.productNames : [],
    molecules: data.molecules || '',
    dosageForms: Array.isArray(data.dosageForms) ? data.dosageForms : [],
    samplesAvailable: Boolean(data.samplesAvailable),
    companyOffice: data.companyOffice || '',
    medInfoHelpline: data.medInfoHelpline || '',
    profileScore: typeof data.profileScore === 'number' ? data.profileScore : 50,
    updatedAt: toTimestamp(data.updatedAt || serverTimestamp())
  };
  await setDoc(repRef, payload);
}

/**
 * Updates an existing rep profile
 * @param {string} uid 
 * @param {Partial<RepDoc>} updates 
 * @returns {Promise<void>}
 */
export async function updateRep(uid, updates) {
  if (!uid) return;
  const repRef = doc(db, COLLECTION, uid);
  await updateDoc(repRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

/**
 * Real-time listener for a rep profile
 * @param {string} uid 
 * @param {(rep: (RepDoc & { id: string })|null) => void} callback 
 * @returns {() => void}
 */
export function subscribeRep(uid, callback) {
  if (!uid) {
    callback(null);
    return () => {};
  }
  return onSnapshot(doc(db, COLLECTION, uid), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  }, (err) => {
    console.error('subscribeRep error:', err);
    callback(null);
  });
}
