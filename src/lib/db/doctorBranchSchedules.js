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
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'doctorBranchSchedules';

/**
 * @typedef {Object} DoctorBranchScheduleDoc
 * @property {string} doctorId
 * @property {string} doctorName
 * @property {string} specialty
 * @property {string} branchId
 * @property {string} branchName
 * @property {Array<{ start: string, end: string }>} sessions
 * @property {'active' | 'inactive'} status
 * @property {import('firebase/firestore').Timestamp} [updatedAt]
 */

/**
 * Generates composite doc ID
 */
export function getScheduleDocId(doctorId, branchId) {
  return `${doctorId}_${branchId}`;
}

/**
 * Fetches schedule for a specific doctor at a specific branch
 * @param {string} doctorId 
 * @param {string} branchId 
 * @returns {Promise<(DoctorBranchScheduleDoc & { id: string })|null>}
 */
export async function getDoctorBranchSchedule(doctorId, branchId) {
  if (!doctorId || !branchId) return null;
  const id = getScheduleDocId(doctorId, branchId);
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Lists all doctor schedules configured for a branch
 * @param {string} branchId 
 * @returns {Promise<Array<DoctorBranchScheduleDoc & { id: string }>>}
 */
export async function listDoctorBranchSchedules(branchId) {
  if (!branchId) return [];
  const q = query(collection(db, COLLECTION), where('branchId', '==', branchId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Real-time subscription to doctor schedules for a branch
 * @param {string} branchId 
 * @param {(schedules: Array<DoctorBranchScheduleDoc & { id: string }>) => void} callback 
 * @returns {() => void}
 */
export function subscribeDoctorBranchSchedules(branchId, callback) {
  if (!branchId) {
    callback([]);
    return () => {};
  }

  const q = query(collection(db, COLLECTION), where('branchId', '==', branchId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(list);
  }, (err) => {
    console.error('Error subscribing to doctor branch schedules:', err);
    callback([]);
  });
}

/**
 * Sets or updates a doctor's schedule for a branch
 * @param {string} doctorId 
 * @param {string} branchId 
 * @param {Partial<DoctorBranchScheduleDoc>} data 
 */
export async function setDoctorBranchSchedule(doctorId, branchId, data) {
  if (!doctorId || !branchId) throw new Error('doctorId and branchId are required');
  const id = getScheduleDocId(doctorId, branchId);

  const payload = {
    doctorId,
    branchId,
    doctorName: data.doctorName || 'Dr. Doctor',
    specialty: data.specialty || 'Specialist',
    branchName: data.branchName || 'Main Branch',
    sessions: data.sessions || [
      { start: '10:00 AM', end: '01:00 PM' },
      { start: '06:00 PM', end: '09:00 PM' }
    ],
    status: data.status || 'active',
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, COLLECTION, id), payload, { merge: true });
}

/**
 * Seeds initial doctor schedules for REMEDI Clinic Kurnool branch
 * @param {string} branchId 
 */
export async function seedRemediDoctorSchedules(branchId) {
  if (!branchId) return;
  const existing = await listDoctorBranchSchedules(branchId);
  if (existing.length > 0) return;

  const initial = [
    {
      doctorId: 'dr_t_karthik',
      doctorName: 'Dr. T. Karthik',
      specialty: 'General Medicine',
      branchName: 'Main Branch',
      sessions: [
        { start: '10:00 AM', end: '01:00 PM' },
        { start: '06:00 PM', end: '09:00 PM' }
      ],
      status: 'active'
    },
    {
      doctorId: 'dr_k_ramya',
      doctorName: 'Dr. K. Ramya',
      specialty: 'Dermatology & Cosmetology',
      branchName: 'Main Branch',
      sessions: [
        { start: '10:00 AM', end: '03:00 PM' },
        { start: '06:00 PM', end: '09:00 PM' }
      ],
      status: 'active'
    },
    {
      doctorId: 'dr_d_v_subba_reddy',
      doctorName: 'Dr. D V Subba Reddy',
      specialty: 'Orthopedics',
      branchName: 'Main Branch',
      sessions: [
        { start: '10:00 AM', end: '02:00 PM' }
      ],
      status: 'active'
    }
  ];

  for (const s of initial) {
    await setDoctorBranchSchedule(s.doctorId, branchId, s);
  }
}
