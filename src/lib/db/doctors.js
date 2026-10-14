import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { toTimestamp } from '../time';

/**
 * @typedef {Object} WeeklyTimeRange
 * @property {string} start e.g. "14:00"
 * @property {string} end e.g. "16:00"
 */

/**
 * @typedef {Object} RepSchedule
 * @property {number} slotMinutes e.g. 20
 * @property {number} maxRepsPerDay e.g. 3
 * @property {number} maxRepsPerSlot e.g. 1
 * @property {number} advanceDays e.g. 14
 * @property {Record<'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun', WeeklyTimeRange[]>} weekly
 * @property {string[]} blockedDates e.g. ["2026-10-31"]
 */

/**
 * @typedef {Object} DoctorPrivacy
 * @property {boolean} visibleInSearch
 * @property {boolean} showFullName
 * @property {boolean} showSpecialty
 * @property {boolean} showCity
 * @property {boolean} showClinicName
 * @property {boolean} showRepHours
 * @property {boolean} allowAppointmentRequest
 * @property {boolean} allowWhatsAppRedirect
 * @property {boolean} rejectionReasonsEnabled
 */

/**
 * @typedef {Object} DoctorStats
 * @property {number} avgResponseMinutes
 * @property {number} decisionsCount
 */

/**
 * @typedef {Object} DoctorDoc
 * @property {string} uid
 * @property {string} name
 * @property {string} photoUrl
 * @property {string} specialty
 * @property {string} qualifications
 * @property {string} [regNumber]
 * @property {number} [yearsExperience]
 * @property {string} city
 * @property {string} state
 * @property {string[]} clinicIds
 * @property {string} profileSlug
 * @property {DoctorPrivacy} privacy
 * @property {RepSchedule} repSchedule
 * @property {DoctorStats} stats
 * @property {import('firebase/firestore').Timestamp} updatedAt
 */

export const DEFAULT_REP_SCHEDULE = {
  slotMinutes: 20,
  maxRepsPerDay: 3,
  maxRepsPerSlot: 1,
  advanceDays: 14,
  weekly: {
    mon: [{ start: "14:00", end: "16:00" }],
    tue: [],
    wed: [{ start: "14:00", end: "16:00" }],
    thu: [],
    fri: [{ start: "14:00", end: "16:00" }],
    sat: [],
    sun: []
  },
  blockedDates: []
};

export const DEFAULT_DOCTOR_PRIVACY = {
  visibleInSearch: true,
  showFullName: true,
  showSpecialty: true,
  showCity: true,
  showClinicName: true,
  showRepHours: true,
  allowAppointmentRequest: true,
  allowWhatsAppRedirect: true,
  rejectionReasonsEnabled: true
};

export const DEFAULT_DOCTOR_STATS = {
  avgResponseMinutes: 0,
  decisionsCount: 0
};

const COLLECTION = 'doctors';

/**
 * Fetches public doctor profile by UID
 * @param {string} uid 
 * @returns {Promise<DoctorDoc|null>}
 */
export async function getDoctor(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, COLLECTION, uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Creates or overwrites doctor profile
 * @param {string} uid 
 * @param {Partial<DoctorDoc>} data 
 * @returns {Promise<void>}
 */
export async function createDoctor(uid, data) {
  if (!uid) throw new Error('UID is required to create a doctor profile');
  const docRef = doc(db, COLLECTION, uid);
  const payload = {
    uid,
    name: data.name || '',
    photoUrl: data.photoUrl || '',
    specialty: data.specialty || '',
    qualifications: data.qualifications || '',
    regNumber: data.regNumber || '',
    yearsExperience: Number(data.yearsExperience || 0),
    city: data.city || '',
    state: data.state || '',
    clinicIds: Array.isArray(data.clinicIds) ? data.clinicIds : [],
    profileSlug: data.profileSlug || '',
    privacy: {
      ...DEFAULT_DOCTOR_PRIVACY,
      ...(data.privacy || {})
    },
    repSchedule: {
      ...DEFAULT_REP_SCHEDULE,
      ...(data.repSchedule || {})
    },
    stats: {
      ...DEFAULT_DOCTOR_STATS,
      ...(data.stats || {})
    },
    updatedAt: data.updatedAt ? toTimestamp(data.updatedAt) : serverTimestamp()
  };
  await setDoc(docRef, payload, { merge: true });
}

/**
 * Updates an existing doctor profile
 * @param {string} uid 
 * @param {Partial<DoctorDoc>} updates 
 * @returns {Promise<void>}
 */
export async function updateDoctor(uid, updates) {
  if (!uid) return;
  const docRef = doc(db, COLLECTION, uid);
  const { id, uid: _uid, ...cleanUpdates } = updates;
  await updateDoc(docRef, {
    ...cleanUpdates,
    updatedAt: serverTimestamp()
  });
}

/**
 * Real-time listener for a doctor profile
 * @param {string} uid 
 * @param {(doctor: (DoctorDoc & { id: string })|null) => void} callback 
 * @returns {() => void}
 */
export function subscribeDoctor(uid, callback) {
  if (!uid) {
    callback(null);
    return () => {};
  }
  return onSnapshot(doc(db, COLLECTION, uid), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  }, (err) => {
    console.error('subscribeDoctor error:', err);
    callback(null);
  });
}

/**
 * Searches visible doctors with optional city / specialty filtering
 * @param {Object} [filter]
 * @param {string} [filter.city]
 * @param {string} [filter.specialty]
 * @returns {Promise<Array<DoctorDoc & { id: string }>>}
 */
export async function listVisibleDoctors(filter = {}) {
  let q = query(collection(db, COLLECTION), where('privacy.visibleInSearch', '==', true));
  if (filter.city) {
    q = query(q, where('city', '==', filter.city));
  }
  if (filter.specialty) {
    q = query(q, where('specialty', '==', filter.specialty));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
