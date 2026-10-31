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
  updateDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'platformSubscriptions';

/**
 * @typedef {Object} SubscriptionDoc
 * @property {string} tenantId
 * @property {string} tenantName
 * @property {'clinic' | 'enterprise'} tenantType
 * @property {string} city
 * @property {string} planName
 * @property {number} amountPerMonth
 * @property {'active' | 'expiring_soon' | 'overdue'} status
 * @property {string} renewsAtDate
 * @property {number} [overdueDays]
 * @property {string[]} features
 * @property {import('firebase/firestore').Timestamp} updatedAt
 */

export const SUBSCRIPTION_PLANS = {
  BASIC: {
    id: 'basic',
    name: 'Basic',
    price: 0,
    cycle: '/ month',
    target: 'individual',
    features: ['Appointment management', 'Basic analytics', '1 location']
  },
  CLINIC_PRO: {
    id: 'clinic_pro',
    name: 'Clinic Pro',
    price: 1499,
    cycle: '/ month',
    target: 'clinic',
    badge: 'Most Popular',
    features: [
      'Reception kiosk',
      'Staff delegation',
      'WhatsApp alerts',
      'Multi-location',
      'Advanced analytics'
    ]
  },
  HOSPITAL_CUSTOM: {
    id: 'hospital_custom',
    name: 'Hospital Custom',
    price: 4999,
    cycle: '/ month',
    target: 'hospital',
    features: [
      'Multiple branches',
      'Role management',
      'Dedicated support',
      'Custom integration'
    ]
  },
  PHARMA_ENTERPRISE: {
    id: 'pharma_enterprise',
    name: 'Enterprise Plan',
    price: 9999,
    cycle: '/ month',
    target: 'enterprise',
    features: [
      'Field force management',
      'Territory hierarchy tree',
      'Real-time DCR compliance',
      'Coverage analytics'
    ]
  }
};

/**
 * Fetches subscription by tenantId
 * @param {string} tenantId 
 * @returns {Promise<(SubscriptionDoc & { id: string })|null>}
 */
export async function getSubscription(tenantId) {
  if (!tenantId) return null;
  const snap = await getDoc(doc(db, COLLECTION, tenantId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Lists all active platform subscriptions
 * @returns {Promise<Array<SubscriptionDoc & { id: string }>>}
 */
export async function listSubscriptions() {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Real-time subscription to platform subscriptions
 * @param {(subs: Array<SubscriptionDoc & { id: string }>) => void} callback 
 * @returns {() => void}
 */
export function subscribeSubscriptions(callback) {
  return onSnapshot(collection(db, COLLECTION), (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(list);
  }, (err) => {
    console.error('Error subscribing to subscriptions:', err);
    callback([]);
  });
}

/**
 * Sets or updates a subscription for a tenant
 * @param {string} tenantId 
 * @param {Partial<SubscriptionDoc>} data 
 */
export async function setSubscription(tenantId, data) {
  if (!tenantId) throw new Error('tenantId is required');
  await setDoc(doc(db, COLLECTION, tenantId), {
    tenantId,
    tenantName: data.tenantName || 'Tenant Organization',
    tenantType: data.tenantType || 'clinic',
    city: data.city || 'Kurnool',
    planName: data.planName || 'Clinic Pro',
    amountPerMonth: Number(data.amountPerMonth) || 1499,
    status: data.status || 'active',
    renewsAtDate: data.renewsAtDate || '15 Nov 2026',
    overdueDays: data.overdueDays || 0,
    features: data.features || SUBSCRIPTION_PLANS.CLINIC_PRO.features,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

/**
 * Seeds demo subscriptions matching Reference Image 16 Screen 4
 */
export async function seedDemoSubscriptions() {
  const existing = await listSubscriptions();
  if (existing.length > 0) return;

  const initial = [
    {
      tenantId: 'remedi_clinic',
      tenantName: 'Remedi Clinic',
      tenantType: 'clinic',
      city: 'Kurnool',
      planName: 'Clinic Plan',
      amountPerMonth: 2999,
      status: 'active',
      renewsAtDate: '15 Nov 2026'
    },
    {
      tenantId: 'sunrise_pharma',
      tenantName: 'Sunrise Pharma',
      tenantType: 'enterprise',
      city: 'Hyderabad',
      planName: 'Enterprise Plan',
      amountPerMonth: 9999,
      status: 'active',
      renewsAtDate: '20 Nov 2026'
    },
    {
      tenantId: 'lifecare_clinic',
      tenantName: 'LifeCare Clinic',
      tenantType: 'clinic',
      city: 'Nandyal',
      planName: 'Clinic Plan',
      amountPerMonth: 2999,
      status: 'expiring_soon',
      renewsAtDate: '5 Nov 2026'
    },
    {
      tenantId: 'medivo_health',
      tenantName: 'Medivo Health',
      tenantType: 'enterprise',
      city: 'Bengaluru',
      planName: 'Enterprise Plan',
      amountPerMonth: 9999,
      status: 'overdue',
      renewsAtDate: 'Overdue by 3 days',
      overdueDays: 3
    }
  ];

  for (const s of initial) {
    await setSubscription(s.tenantId, s);
  }
}
