import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyCh_fOuZQU4evEFU4yy6ZGdVDmetChN21Y",
    authDomain: "khalfilib.firebaseapp.com",
    databaseURL: "https://khalfilib-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "khalfilib",
    storageBucket: "khalfilib.firebasestorage.app",
    messagingSenderId: "508622213369",
    appId: "1:508622213369:web:ff224aa43f7153c8d89228",
    measurementId: "G-7DVMM7B0S6"
};

// Ensure app is only initialized once to prevent Hot Reload crashing
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

console.log(`[Firebase] Initializing Realtime Database from URL: ${firebaseConfig.databaseURL}`);

// Initialize Realtime Database
const rtdbInstance = getDatabase(app);

export const db = rtdbInstance;

