import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const getUserProfileByUid = async (uid: string) => {
  const snap = await getDoc(doc(db, 'users', uid));

  if (!snap.exists()) {
    throw new Error('Perfil não encontrado');
  }

  const data = snap.data();

  return {
    id: uid,
    name: data.name,
    email: data.email,
    role: data.role || 'user'
  };
};
