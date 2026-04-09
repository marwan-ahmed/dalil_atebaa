import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAKotlA5okUkqDUyWeFuNobzop08jgi1q0",
  authDomain: "doctors-directory-web.firebaseapp.com",
  projectId: "doctors-directory-web",
  storageBucket: "doctors-directory-web.firebasestorage.app",
  messagingSenderId: "223393422079",
  appId: "1:223393422079:web:736e3275aa2d7532998aca"
};

const isConfigValid = true;

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { app, auth, db, googleProvider, signInWithPopup, signOut, isConfigValid };
