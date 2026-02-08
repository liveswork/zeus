import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';



// Sua configuração do Firebase aqui

const firebaseConfig = {
  apiKey: "AIzaSyDg-PozsZO3mMihBwSZSP_pBX7dh7j2Nno",
  authDomain: "zeuspdv.firebaseapp.com",
  projectId: "zeuspdv",
  storageBucket: "zeuspdv.firebasestorage.app",
  messagingSenderId: "57490465215",
  appId: "1:57490465215:web:ca4b934fb89dc22ae8c10a"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// export const functions = getFunctions(app);

// 2. Especifique a região das suas functions. O erro indica 'us-central1'.
const functions = getFunctions(app, 'us-central1'); // Especifique a região correta aqui  
// 3. Exporte a nova instância 'functions'
export { app, functions };

export default app;