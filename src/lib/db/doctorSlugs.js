import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { slugify } from '../ids';

/**
 * @typedef {Object} DoctorSlugDoc
 * @property {string} uid
 * @property {string} slug
 */

const COLLECTION = 'doctorSlugs';

/**
 * Resolves a doctor's UID from a profile slug
 * @param {string} slug 
 * @returns {Promise<string|null>}
 */
export async function getDoctorUidBySlug(slug) {
  if (!slug) return null;
  const cleanSlug = slugify(slug);
  const snap = await getDoc(doc(db, COLLECTION, cleanSlug));
  if (snap.exists()) return snap.data().uid;

  // Fallback: check if slug is doctor's UID directly
  const drSnap = await getDoc(doc(db, 'doctors', slug));
  if (drSnap.exists()) return slug;

  return null;
}

/**
 * Claims or sets a unique slug for a doctor
 * @param {string} slug 
 * @param {string} uid 
 * @returns {Promise<string>} clean claimed slug
 */
export async function setDoctorSlug(slug, uid) {
  if (!slug || !uid) throw new Error('slug and uid are required');
  const cleanSlug = slugify(slug);
  await setDoc(doc(db, COLLECTION, cleanSlug), {
    uid,
    slug: cleanSlug
  });
  return cleanSlug;
}

/**
 * Checks if a slug is available for claiming by a given user
 * @param {string} slug 
 * @param {string} [currentUid] 
 * @returns {Promise<boolean>}
 */
export async function isSlugAvailable(slug, currentUid) {
  if (!slug) return false;
  const cleanSlug = slugify(slug);
  const snap = await getDoc(doc(db, COLLECTION, cleanSlug));
  if (!snap.exists()) return true;
  if (currentUid && snap.data().uid === currentUid) return true;
  return false;
}
