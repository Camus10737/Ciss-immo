// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD5md30kvP0nKQ2uUT1n-RGHQzntmIu5uo",
  authDomain: "ciss-immo.firebaseapp.com",
  projectId: "ciss-immo",
  storageBucket: "ciss-immo.firebasestorage.app",
  messagingSenderId: "678705301941",
  appId: "1:678705301941:web:7cdcc7e6a8b71b3a3471fc"
};

// Initialise Firebase
const app = initializeApp(firebaseConfig);

// Exporte les services qu'on va utiliser
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;