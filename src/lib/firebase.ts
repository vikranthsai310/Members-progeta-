
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  // Replace these placeholder values with your actual Firebase config values
  // Go to Firebase console > Project settings > General > Your apps > SDK setup and configuration
  apiKey: "YOUR_API_KEY", // Replace with your actual API key
  authDomain: "YOUR_AUTH_DOMAIN", // Replace with your actual Auth Domain
  projectId: "YOUR_PROJECT_ID", // Replace with your actual Project ID
  storageBucket: "YOUR_STORAGE_BUCKET", // Replace with your actual Storage Bucket
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your actual Messaging Sender ID
  appId: "YOUR_APP_ID", // Replace with your actual App ID
  measurementId: "YOUR_MEASUREMENT_ID", // Replace with your actual Measurement ID (optional)
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;
