import { 
  addDoc, onSnapshot, collection, query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'doctorRequests';

/**
 * Submits a recommendation from a rep for a non-participating doctor to join Gatepass
 * @param {Object} data 
 * @returns {Promise<string>}
 */
export async function submitDoctorRequest(data) {
  if (!data.repId || !data.doctorName) {
    throw new Error('repId and doctorName are required');
  }

  const payload = {
    repId: data.repId,
    doctorName: data.doctorName.trim(),
    clinicName: (data.clinicName || '').trim(),
    city: (data.city || 'Kurnool').trim(),
    phone: (data.phone || '').trim(),
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, COLLECTION), payload);
  return docRef.id;
}

/**
 * Subscribes to all doctor join requests (for platform_admin owner stats)
 */
export function subscribeAllDoctorRequests(callback) {
  const q = query(
    collection(db, COLLECTION),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.error('subscribeAllDoctorRequests error:', err);
    callback([]);
  });
}
