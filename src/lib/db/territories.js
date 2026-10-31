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

const COLLECTION = 'territories';

/**
 * @typedef {Object} TerritoryDoc
 * @property {string} companyId
 * @property {string} stateRegion
 * @property {string} parentRegion
 * @property {string} territoryName
 * @property {string} territoryCode
 * @property {string} areaCoverage
 * @property {number} doctorCount
 * @property {number} representativeCount
 * @property {Array<{ empId: string, name: string, status: 'active' | 'inactive' }>} assignedRepresentatives
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

/**
 * Lists all territories for a company
 * @param {string} companyId 
 * @returns {Promise<Array<TerritoryDoc & { id: string }>>}
 */
export async function listTerritoriesByCompany(companyId) {
  if (!companyId) return [];
  const q = query(collection(db, COLLECTION), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Subscribes to company territories in real-time
 * @param {string} companyId 
 * @param {(territories: Array<TerritoryDoc & { id: string }>) => void} callback 
 * @returns {() => void}
 */
export function subscribeTerritories(companyId, callback) {
  if (!companyId) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, COLLECTION), where('companyId', '==', companyId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(list);
  }, (err) => {
    console.error('Error subscribing to territories:', err);
    callback([]);
  });
}

/**
 * Creates a territory
 * @param {string} companyId 
 * @param {Partial<TerritoryDoc>} data 
 * @returns {Promise<string>}
 */
export async function createTerritory(companyId, data) {
  if (!companyId) throw new Error('companyId is required');

  const payload = {
    companyId,
    stateRegion: data.stateRegion || 'Andhra Pradesh',
    parentRegion: data.parentRegion || 'Kurnool Region',
    territoryName: data.territoryName || 'Kurnool A',
    territoryCode: data.territoryCode || 'KR-A',
    areaCoverage: data.areaCoverage || 'Kurnool City & Surroundings',
    doctorCount: Number(data.doctorCount) || 0,
    representativeCount: Number(data.representativeCount) || 0,
    assignedRepresentatives: data.assignedRepresentatives || [],
    createdAt: serverTimestamp()
  };

  const ref = await addDoc(collection(db, COLLECTION), payload);
  return ref.id;
}

/**
 * Seeds initial demo hierarchy for Pharma Enterprise (Sunrise Pharma)
 * @param {string} companyId 
 */
export async function seedSunriseTerritories(companyId = 'sunrise_pharma') {
  const existing = await listTerritoriesByCompany(companyId);
  if (existing.length > 0) return;

  const initial = [
    {
      stateRegion: 'Andhra Pradesh',
      parentRegion: 'Kurnool Region',
      territoryName: 'Kurnool A',
      territoryCode: 'KR-A',
      areaCoverage: 'Kurnool City & Surroundings',
      doctorCount: 186,
      representativeCount: 22,
      assignedRepresentatives: [
        { empId: 'EMP001', name: 'Rajesh Kumar', status: 'active' },
        { empId: 'EMP005', name: 'Neha Verma', status: 'active' },
        { empId: 'EMP008', name: 'Sandeep Yadav', status: 'active' }
      ]
    },
    {
      stateRegion: 'Andhra Pradesh',
      parentRegion: 'Kurnool Region',
      territoryName: 'Kurnool B',
      territoryCode: 'KR-B',
      areaCoverage: 'Kurnool Rural & Industrial Area',
      doctorCount: 120,
      representativeCount: 18,
      assignedRepresentatives: [
        { empId: 'EMP002', name: 'Priya Sharma', status: 'active' },
        { empId: 'EMP007', name: 'Kavya Nair', status: 'active' }
      ]
    },
    {
      stateRegion: 'Andhra Pradesh',
      parentRegion: 'Kurnool Region',
      territoryName: 'Nandyal',
      territoryCode: 'NDL',
      areaCoverage: 'Nandyal Town & Sanjamala',
      doctorCount: 95,
      representativeCount: 20,
      assignedRepresentatives: [
        { empId: 'EMP003', name: 'Amit Singh', status: 'active' }
      ]
    },
    {
      stateRegion: 'Andhra Pradesh',
      parentRegion: 'Kurnool Region',
      territoryName: 'Adoni',
      territoryCode: 'ADN',
      areaCoverage: 'Adoni Municipality & Yemmiganur',
      doctorCount: 80,
      representativeCount: 18,
      assignedRepresentatives: [
        { empId: 'EMP004', name: 'Suresh Reddy', status: 'active' }
      ]
    }
  ];

  for (const t of initial) {
    await createTerritory(companyId, t);
  }
}
