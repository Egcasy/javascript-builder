import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBkUo608pM3OGgnPIxvEwpFPV5fXOmNFo8",
  authDomain: "ticketv-4fb74.firebaseapp.com",
  projectId: "ticketv-4fb74",
  storageBucket: "ticketv-4fb74.firebasestorage.app",
  messagingSenderId: "175437388012",
  appId: "1:175437388012:web:f99773459d0bb7960dedc9",
  measurementId: "G-ZMJJZYFW0G",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

export async function initAnalytics() {
  if (typeof window === "undefined") return null;
  const supported = await isSupported();
  return supported ? getAnalytics(firebaseApp) : null;
}
