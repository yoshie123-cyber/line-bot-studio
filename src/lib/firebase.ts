import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAv9tcEOyncwUp9cO0vytgoh3k4FOpnzKs",
    authDomain: "linebot-66e62.firebaseapp.com",
    projectId: "linebot-66e62",
    storageBucket: "linebot-66e62.firebasestorage.app",
    messagingSenderId: "602306769723",
    appId: "1:602306769723:web:be5117d50dd58e35197d1e",
    measurementId: "G-MLZVQVB9E0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
