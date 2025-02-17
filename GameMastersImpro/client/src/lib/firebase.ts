
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

if (!import.meta.env.VITE_FIREBASE_API_KEY || 
    !import.meta.env.VITE_FIREBASE_PROJECT_ID || 
    !import.meta.env.VITE_FIREBASE_APP_ID) {
  throw new Error("Missing Firebase configuration. Please check your environment variables.");
}

const firebaseConfig = {
  apiKey: "AIzaSyCokto_f-rtYu5eLDnQqjX_Vi2ihIjZv4E",
  authDomain: "gamerentalsystem.firebaseapp.com",
  projectId: "gamerentalsystem",
  storageBucket: "gamerentalsystem.firebasestorage.app",
  messagingSenderId: "883966873547",
  appId: "1:883966873547:web:8397324f25825b15be704e",
  measurementId: "G-DV0XVZQ64S"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
