import { getDoc, doc } from 'firebase/firestore';

export async function generateUniqueToken(db) {
  const chars = '0123456789';
  let token, exists;
  do {
    const digits = Array.from({length: 4}, () => 
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    token = 'RM' + digits;
    const docSnap = await getDoc(doc(db, 'tokens', token));
    exists = docSnap.exists();
  } while (exists);
  return token;
}
