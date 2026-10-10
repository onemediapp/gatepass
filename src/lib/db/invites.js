import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'invites';

/**
 * Checks if a doctor's email is invited for beta access
 * Email is always looked up in lowercase
 * @param {string} email 
 * @returns {Promise<boolean>}
 */
export async function checkDoctorInvite(email) {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  try {
    const snap = await getDoc(doc(db, COLLECTION, cleanEmail));
    return snap.exists();
  } catch (err) {
    // If not authenticated or blocked, returns false
    return false;
  }
}
