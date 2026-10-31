/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'pharmaCompanies';

/**
 * @typedef {Object} PharmaCompanyDoc
 * @property {string} name
 * @property {string} headOffice
 * @property {string} [website]
 * @property {number} representativeCount
 * @property {string[]} therapeuticAreas
 * @property {'pending' | 'verified' | 'rejected'} verificationStatus
 * @property {string} planType
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} [verifiedAt]
 */

/**
 * Fetches a pharma company by ID
 * @param {string} companyId 
 * @returns {Promise<(PharmaCompanyDoc & { id: string })|null>}
 */
export async function getPharmaCompany(companyId) {
  if (!companyId) return null;
  const snap = await getDoc(doc(db, COLLECTION, companyId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Lists all registered pharma companies
 * @returns {Promise<Array<PharmaCompanyDoc & { id: string }>>}
 */
export async function listPharmaCompanies() {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Real-time subscription to pharma companies
 * @param {(companies: Array<PharmaCompanyDoc & { id: string }>) => void} callback 
 * @returns {() => void}
 */
export function subscribePharmaCompanies(callback) {
  return onSnapshot(collection(db, COLLECTION), (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(list);
  }, (err) => {
    console.error('Error subscribing to pharma companies:', err);
    callback([]);
  });
}

/**
 * Creates or registers a pharma company
 * @param {Partial<PharmaCompanyDoc>} data 
 * @returns {Promise<string>} companyId
 */
export async function createPharmaCompany(data) {
  const payload = {
    name: data.name || '',
    headOffice: data.headOffice || 'Hyderabad',
    representativeCount: Number(data.representativeCount) || 0,
    therapeuticAreas: data.therapeuticAreas || ['General Medicine'],
    verificationStatus: data.verificationStatus || 'pending',
    planType: data.planType || 'Enterprise Plan',
    createdAt: serverTimestamp()
  };

  const ref = await addDoc(collection(db, COLLECTION), payload);
  return ref.id;
}

/**
 * Updates company details
 * @param {string} companyId 
 * @param {Partial<PharmaCompanyDoc>} updates 
 */
export async function updatePharmaCompany(companyId, updates) {
  if (!companyId) return;
  await updateDoc(doc(db, COLLECTION, companyId), {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

/**
 * Verifies or rejects a pharma company (Platform Admin action)
 * @param {string} companyId 
 * @param {'verified' | 'rejected'} status 
 */
export async function verifyPharmaCompany(companyId, status) {
  if (!companyId) return;
  await updateDoc(doc(db, COLLECTION, companyId), {
    verificationStatus: status,
    verifiedAt: serverTimestamp()
  });
}

/**
 * Seeds initial pharma companies matching Reference Batches 12 & 16
 */
export async function seedPharmaCompanies() {
  const existing = await listPharmaCompanies();
  if (existing.length > 0) return;

  const initial = [
    {
      name: 'Sunrise Pharma',
      headOffice: 'Hyderabad',
      representativeCount: 45,
      therapeuticAreas: ['General Medicine', 'Cardiology', 'Diabetology'],
      verificationStatus: 'pending',
      planType: 'Enterprise Plan'
    },
    {
      name: 'Medivo Health',
      headOffice: 'Bengaluru',
      representativeCount: 32,
      therapeuticAreas: ['Respiratory', 'Dermatology'],
      verificationStatus: 'verified',
      planType: 'Enterprise Plan'
    },
    {
      name: 'CureWell Pharma',
      headOffice: 'Mumbai',
      representativeCount: 28,
      therapeuticAreas: ['Orthopedics', 'Pediatrics'],
      verificationStatus: 'pending',
      planType: 'Enterprise Plan'
    },
    {
      name: 'Torrent Pharma Ltd.',
      headOffice: 'Ahmedabad, Gujarat',
      representativeCount: 120,
      therapeuticAreas: ['Diabetology', 'Cardiology'],
      verificationStatus: 'verified',
      planType: 'Enterprise Plan'
    }
  ];

  for (const c of initial) {
    await createPharmaCompany(c);
  }
}
