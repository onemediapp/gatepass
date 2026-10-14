import { 
  doc, getDoc, setDoc, addDoc, updateDoc, onSnapshot, 
  collection, query, where, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'reviewRequests';

/**
 * @typedef {Object} ReviewRequestDoc
 * @property {string} doctorId
 * @property {string} repId
 * @property {{ name: string, company: string, designation: string, mobile: string }} repSnapshot
 * @property {'reconsider'|'product_review'} kind
 * @property {string} [appointmentId]
 * @property {string} [productName]
 * @property {string} [benefit]
 * @property {string} [materialLink]
 * @property {string} message
 * @property {'open'|'interested'|'not_interested'|'need_info'|'closed'} status
 * @property {string} doctorReply
 * @property {import('firebase/firestore').Timestamp|null} repliedAt
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {boolean} mutedByDoctor
 */

/**
 * Creates a new review request (reconsider or product review)
 * @param {Partial<ReviewRequestDoc>} data 
 * @returns {Promise<string>}
 */
export async function createReviewRequest(data) {
  if (!data.doctorId || !data.repId) {
    throw new Error('doctorId and repId are required');
  }

  const payload = {
    doctorId: data.doctorId,
    repId: data.repId,
    repSnapshot: {
      name: data.repSnapshot?.name || '',
      company: data.repSnapshot?.company || '',
      designation: data.repSnapshot?.designation || '',
      mobile: data.repSnapshot?.mobile || ''
    },
    kind: data.kind || 'product_review',
    appointmentId: data.appointmentId || '',
    productName: data.productName || '',
    benefit: data.benefit || '',
    materialLink: data.materialLink || '',
    message: (data.message || '').slice(0, 400),
    status: 'open',
    doctorReply: '',
    repliedAt: null,
    mutedByDoctor: false,
    createdAt: serverTimestamp()
  };

  // For reconsider requests, use canonical id "rc_<appointmentId>"
  if (data.kind === 'reconsider' && data.appointmentId) {
    const customId = `rc_${data.appointmentId}`;
    await setDoc(doc(db, COLLECTION, customId), payload);
    return customId;
  }

  const docRef = await addDoc(collection(db, COLLECTION), payload);
  return docRef.id;
}

export async function getReviewRequest(id) {
  if (!id) return null;
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateReviewRequest(id, updates) {
  if (!id) return;
  await updateDoc(doc(db, COLLECTION, id), {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

/**
 * Subscribes to open/all review requests for a doctor
 */
export function subscribeDoctorReviewRequests(doctorId, callback) {
  if (!doctorId) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, COLLECTION),
    where('doctorId', '==', doctorId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.error('subscribeDoctorReviewRequests error:', err);
    callback([]);
  });
}

/**
 * Subscribes to review requests created by a rep
 */
export function subscribeRepReviewRequests(repId, callback) {
  if (!repId) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, COLLECTION),
    where('repId', '==', repId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.error('subscribeRepReviewRequests error:', err);
    callback([]);
  });
}
