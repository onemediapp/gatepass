/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'clinicStaff';

/**
 * @typedef {Object} ClinicStaffDoc
 * @property {string} clinicId
 * @property {string[]} branchIds
 * @property {string} name
 * @property {string} mobile
 * @property {string} email
 * @property {string} role
 * @property {string[]} permissions
 * @property {'active' | 'inactive'} status
 * @property {string} [pin]
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} [updatedAt]
 */

export const STAFF_ROLES = [
  'Receptionist',
  'Administrator',
  'Nurse',
  'Pharmacist',
  'Lab Technician',
  'Front Desk'
];

export const AVAILABLE_PERMISSIONS = [
  'Appointments',
  'Check-in',
  'Notices',
  'Vitals',
  'Lab',
  'Reports',
  'Patients',
  'Pharmacy',
  'Inventory',
  'Sales',
  'All Access'
];

/**
 * Fetches staff record by ID
 * @param {string} staffId 
 * @returns {Promise<(ClinicStaffDoc & { id: string })|null>}
 */
export async function getStaff(staffId) {
  if (!staffId) return null;
  const snap = await getDoc(doc(db, COLLECTION, staffId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Lists all staff for a clinic
 * @param {string} clinicId 
 * @returns {Promise<Array<ClinicStaffDoc & { id: string }>>}
 */
export async function listStaffByClinic(clinicId) {
  if (!clinicId) return [];
  const q = query(collection(db, COLLECTION), where('clinicId', '==', clinicId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Subscribes to real-time clinic staff updates
 * @param {string} clinicId 
 * @param {(staff: Array<ClinicStaffDoc & { id: string }>) => void} callback 
 * @returns {() => void}
 */
export function subscribeStaffByClinic(clinicId, callback) {
  if (!clinicId) {
    callback([]);
    return () => {};
  }

  const q = query(collection(db, COLLECTION), where('clinicId', '==', clinicId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(list);
  }, (err) => {
    console.error('Error subscribing to staff:', err);
    callback([]);
  });
}

/**
 * Adds a new staff member to a clinic
 * @param {string} clinicId 
 * @param {Partial<ClinicStaffDoc>} data 
 * @returns {Promise<string>} staffId
 */
export async function createStaff(clinicId, data) {
  if (!clinicId) throw new Error('clinicId is required to create staff');

  const payload = {
    clinicId,
    branchIds: data.branchIds || [],
    name: data.name || '',
    mobile: data.mobile || '',
    email: data.email || '',
    role: data.role || 'Receptionist',
    permissions: data.permissions || ['Appointments', 'Check-in'],
    status: data.status || 'active',
    pin: data.pin || '2026',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const ref = await addDoc(collection(db, COLLECTION), payload);
  return ref.id;
}

/**
 * Updates a staff member
 * @param {string} staffId 
 * @param {Partial<ClinicStaffDoc>} updates 
 */
export async function updateStaff(staffId, updates) {
  if (!staffId) return;
  await updateDoc(doc(db, COLLECTION, staffId), {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

/**
 * Deletes a staff member
 * @param {string} staffId 
 */
export async function deleteStaff(staffId) {
  if (!staffId) return;
  await deleteDoc(doc(db, COLLECTION, staffId));
}

/**
 * Seeds initial staff for REMEDI Clinic if none exist yet
 * @param {string} clinicId 
 */
export async function seedRemediStaff(clinicId) {
  if (!clinicId) return;
  const existing = await listStaffByClinic(clinicId);
  if (existing.length > 0) return;

  const initialStaff = [
    {
      name: 'Priya Reddy',
      role: 'Receptionist',
      mobile: '+91 98765 43210',
      email: 'priya.reddy@remediclinic.com',
      permissions: ['Appointments', 'Check-in', 'Notices'],
      status: 'active',
      pin: '2026'
    },
    {
      name: 'Suresh Kumar',
      role: 'Lab Technician',
      mobile: '+91 98765 43211',
      email: 'suresh.k@remediclinic.com',
      permissions: ['Lab', 'Reports', 'Patients'],
      status: 'active',
      pin: '2026'
    },
    {
      name: 'Anitha R',
      role: 'Pharmacist',
      mobile: '+91 98765 43212',
      email: 'anitha.r@remediclinic.com',
      permissions: ['Pharmacy', 'Inventory', 'Sales'],
      status: 'active',
      pin: '2026'
    },
    {
      name: 'Ramesh Babu',
      role: 'Administrator',
      mobile: '+91 98765 43213',
      email: 'ramesh.admin@remediclinic.com',
      permissions: ['All Access'],
      status: 'active',
      pin: '2026'
    },
    {
      name: 'Kavya Singh',
      role: 'Nurse',
      mobile: '+91 98765 43214',
      email: 'kavya.s@remediclinic.com',
      permissions: ['Check-in', 'Vitals', 'Patients'],
      status: 'active',
      pin: '2026'
    },
    {
      name: 'Manoj Kumar',
      role: 'Front Desk',
      mobile: '+91 98765 43215',
      email: 'manoj.k@remediclinic.com',
      permissions: ['Appointments', 'Check-in'],
      status: 'inactive',
      pin: '2026'
    }
  ];

  for (const s of initialStaff) {
    await createStaff(clinicId, s);
  }
}
