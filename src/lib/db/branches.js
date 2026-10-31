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
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { toTimestamp } from '../time';

const COLLECTION = 'branches';

/**
 * @typedef {Object} BranchDoc
 * @property {string} clinicId
 * @property {string} name
 * @property {'primary' | 'branch'} branchType
 * @property {string} address
 * @property {string} city
 * @property {string} state
 * @property {string} phone
 * @property {string} email
 * @property {boolean} kioskEnabled
 * @property {string} [kioskPin]
 * @property {'active' | 'inactive'} status
 * @property {number} doctorCount
 * @property {number} staffCount
 * @property {string} [mapLocation]
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} [updatedAt]
 */

/**
 * Fetches a single branch by ID
 * @param {string} branchId 
 * @returns {Promise<(BranchDoc & { id: string })|null>}
 */
export async function getBranch(branchId) {
  if (!branchId) return null;
  const snap = await getDoc(doc(db, COLLECTION, branchId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Lists all branches belonging to a clinic
 * @param {string} clinicId 
 * @returns {Promise<Array<BranchDoc & { id: string }>>}
 */
export async function listBranchesByClinic(clinicId) {
  if (!clinicId) return [];
  const q = query(
    collection(db, COLLECTION), 
    where('clinicId', '==', clinicId)
  );
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.branchType === 'primary' ? -1 : 1));
}

/**
 * Real-time subscription to clinic branches
 * @param {string} clinicId 
 * @param {(branches: Array<BranchDoc & { id: string }>) => void} callback 
 * @returns {() => void}
 */
export function subscribeBranchesByClinic(clinicId, callback) {
  if (!clinicId) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, COLLECTION),
    where('clinicId', '==', clinicId)
  );

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.branchType === 'primary' ? -1 : 1));
    callback(list);
  }, (err) => {
    console.error('Error subscribing to branches:', err);
    callback([]);
  });
}

/**
 * Creates a new branch for a clinic
 * @param {string} clinicId 
 * @param {Partial<BranchDoc>} data 
 * @returns {Promise<string>} branchId
 */
export async function createBranch(clinicId, data) {
  if (!clinicId) throw new Error('clinicId is required to create a branch');

  const payload = {
    clinicId,
    name: data.name || 'Main Clinic',
    branchType: data.branchType || 'branch',
    address: data.address || '',
    city: data.city || 'Kurnool',
    state: data.state || 'Andhra Pradesh',
    phone: data.phone || '',
    email: data.email || '',
    kioskEnabled: data.kioskEnabled !== false,
    kioskPin: data.kioskPin || '2026',
    status: data.status || 'active',
    doctorCount: Number(data.doctorCount) || 1,
    staffCount: Number(data.staffCount) || 1,
    mapLocation: data.mapLocation || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const ref = await addDoc(collection(db, COLLECTION), payload);
  return ref.id;
}

/**
 * Updates branch details
 * @param {string} branchId 
 * @param {Partial<BranchDoc>} updates 
 */
export async function updateBranch(branchId, updates) {
  if (!branchId) return;
  await updateDoc(doc(db, COLLECTION, branchId), {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

/**
 * Deletes a branch
 * @param {string} branchId 
 */
export async function deleteBranch(branchId) {
  if (!branchId) return;
  await deleteDoc(doc(db, COLLECTION, branchId));
}

/**
 * Seeds initial demo branches for REMEDI Clinic if none exist yet
 * @param {string} clinicId 
 */
export async function seedRemediBranches(clinicId) {
  if (!clinicId) return;
  const existing = await listBranchesByClinic(clinicId);
  if (existing.length > 0) return;

  const initialBranches = [
    {
      name: 'Remedi Clinic (Kurnool)',
      branchType: 'primary',
      address: 'Beside Vijaya Diagnostics, Gayathri Estates',
      city: 'Kurnool',
      state: 'Andhra Pradesh',
      phone: '9429690055',
      email: 'info@remediclinic.com',
      kioskEnabled: true,
      kioskPin: '2026',
      status: 'active',
      doctorCount: 5,
      staffCount: 8,
      mapLocation: 'Gayathri Estates, Kurnool, Andhra Pradesh'
    },
    {
      name: 'Remedi Clinic (Nandyal)',
      branchType: 'branch',
      address: 'Main Road, Nandyal',
      city: 'Nandyal',
      state: 'Andhra Pradesh',
      phone: '9550011122',
      email: 'nandyal@remediclinic.com',
      kioskEnabled: true,
      kioskPin: '2026',
      status: 'active',
      doctorCount: 2,
      staffCount: 3,
      mapLocation: 'Main Road, Nandyal, Andhra Pradesh'
    },
    {
      name: 'Remedi Clinic (Adoni)',
      branchType: 'branch',
      address: 'Collectorate Road, Adoni',
      city: 'Adoni',
      state: 'Andhra Pradesh',
      phone: '8886699775',
      email: 'adoni@remediclinic.com',
      kioskEnabled: false,
      kioskPin: '2026',
      status: 'inactive',
      doctorCount: 1,
      staffCount: 1,
      mapLocation: 'Collectorate Road, Adoni, Andhra Pradesh'
    }
  ];

  for (const b of initialBranches) {
    await createBranch(clinicId, b);
  }
}
