
// Import the functions you need from the SDKs you need
import { getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCSFXPiU3bbsgWSQppp2bfOXKXktrq7vlo",
  authDomain: "gcs12-150d1.firebaseapp.com",
  projectId: "gcs12-150d1",
  storageBucket: "gcs12-150d1.appspot.com", // Fixed to standard format
  messagingSenderId: "374118779712",
  appId: "1:374118779712:web:430bd7aa56c7628755c8a5",
  measurementId: "G-2YF9CZME5Z"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;
