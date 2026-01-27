import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAv9tcEOyncwUp9cO0vytgoh3k4FOpnzKs",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "linebot-66e62.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "linebot-66e62",
    storageBucket: "linebot-66e62.firebasestorage.app",
    messagingSenderId: "602306769723",
    appId: "1:602306769723:web:be5117d50dd58e35197d1e",
    measurementId: "G-MLZVQVB9E0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
