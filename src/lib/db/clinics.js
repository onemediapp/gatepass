import { doc, getDoc, setDoc, addDoc, updateDoc, onSnapshot, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { slugify } from '../ids';
import { toTimestamp } from '../time';

/**
 * @typedef {Object} ClinicDoc
 * @property {string} clinicName
 * @property {string} address
 * @property {string} city
 * @property {string} state
 * @property {string} [phone]
 * @property {string} slug
 * @property {string} ownerDoctorId
 * @property {string} [qrCodeData]
 * @property {boolean} isActive
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

const COLLECTION = 'clinics';

/**
 * Fetches a clinic by its document ID
 * @param {string} clinicId 
 * @returns {Promise<(ClinicDoc & { id: string })|null>}
 */
export async function getClinic(clinicId) {
  if (!clinicId) return null;
  const snap = await getDoc(doc(db, COLLECTION, clinicId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Fetches a clinic by its unique slug
 * @param {string} slug 
 * @returns {Promise<(ClinicDoc & { id: string })|null>}
 */
export async function getClinicBySlug(slug) {
  if (!slug) return null;
  const q = query(collection(db, COLLECTION), where('slug', '==', slug), where('isActive', '==', true));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

/**
 * Creates a new clinic
 * @param {Partial<ClinicDoc>} data 
 * @returns {Promise<string>} clinicId
 */
export async function createClinic(data) {
  const clinicSlug = slugify(data.slug || data.clinicName || 'clinic');
  const payload = {
    clinicName: data.clinicName || '',
    address: data.address || '',
    city: data.city || '',
    state: data.state || '',
    phone: data.phone || '',
    slug: clinicSlug,
    ownerDoctorId: data.ownerDoctorId || '',
    qrCodeData: data.qrCodeData || '',
    isActive: data.isActive !== false,
    createdAt: data.createdAt ? toTimestamp(data.createdAt) : serverTimestamp()
  };
  const docRef = await addDoc(collection(db, COLLECTION), payload);
  return docRef.id;
}

/**
 * Updates an existing clinic
 * @param {string} clinicId 
 * @param {Partial<ClinicDoc>} updates 
 * @returns {Promise<void>}
 */
export async function updateClinic(clinicId, updates) {
  if (!clinicId) return;
  const docRef = doc(db, COLLECTION, clinicId);
  await updateDoc(docRef, updates);
}

/**
 * Lists all active clinics owned by a doctor
 * @param {string} ownerDoctorId 
 * @returns {Promise<Array<ClinicDoc & { id: string }>>}
 */
export async function listClinicsByDoctor(ownerDoctorId) {
  if (!ownerDoctorId) return [];
  const q = query(collection(db, COLLECTION), where('ownerDoctorId', '==', ownerDoctorId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Subscribes to a clinic document by ID
 * @param {string} clinicId 
 * @param {(clinic: (ClinicDoc & { id: string })|null) => void} callback 
 * @returns {() => void}
 */
export function subscribeClinic(clinicId, callback) {
  if (!clinicId) {
    callback(null);
    return () => {};
  }
  return onSnapshot(doc(db, COLLECTION, clinicId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  }, () => {
    callback(null);
  });
}
