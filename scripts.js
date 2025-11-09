// --- FIREBASE SETUP ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, 
    setPersistence, browserSessionPersistence 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, collection, doc, setDoc, getDoc, 
    query, where, addDoc, getDocs, onSnapshot, 
    serverTimestamp, setLogLevel 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Your embedded Firebase configuration
const userProvidedFirebaseConfig = {
    apiKey: "AIzaSyDJQbgJK4GpvmLEchh0-2mWjrUW3ZAN2QI",
    authDomain: "ev-charger-monitor-85a48.firebaseapp.com",
    projectId: "ev-charger-monitor-85a48",
    storageBucket: "ev-charger-monitor-85a48.firebasestorage.app",
    messagingSenderId: "22222071413",
    appId: "1:22222071413:web:d5a26ffd2a9014cc10fa3c",
    measurementId: "G-PYKSBZ6XHW"
};

// Global variables provided by the environment (Canvas)
const envAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-ev-app';
const envFirebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const envAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Determine which config to use (Environment config preferred, fallback to hardcoded)
const firebaseConfig = envFirebaseConfig || userProvidedFirebaseConfig;
const appId = envAppId; 

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enable debug logging for Firestore (useful for troubleshooting)
setLogLevel('debug');

// --- EXPORTED STATE ---
export let isAuthReady = false;
export let currentUserId = null;

/**
 * Authenticates the user using a custom token (if available) or anonymously.
 * Also sets up the global exports and dispatches a custom event when ready.
 */
async function authenticateUser() {
    try {
        // Use Session persistence to keep the user logged in across page reloads
        await setPersistence(auth, browserSessionPersistence);
        
        let userCredential;
        
        if (envAuthToken) {
            // 1. Sign in using the Canvas provided custom token
            userCredential = await signInWithCustomToken(auth, envAuthToken);
        } else {
            // 2. Sign in anonymously (for GitHub Pages deployment)
            userCredential = await signInAnonymously(auth);
        }

        // Set global state and mark authentication as complete
        currentUserId = userCredential.user.uid;
        isAuthReady = true;

        console.log(`Firebase: User authenticated. UID: ${currentUserId}`);

    } catch (error) {
        console.error("Firebase Authentication Error:", error);
        
        // Fallback to anonymous sign-in if custom token fails
        try {
            const anonymousUserCredential = await signInAnonymously(auth);
            currentUserId = anonymousUserCredential.user.uid;
            isAuthReady = true;
            console.log(`Firebase: Failed custom token, signed in anonymously. UID: ${currentUserId}`);
        } catch (anonError) {
            console.error("Firebase Critical Error: Cannot sign in anonymously.", anonError);
            currentUserId = 'anonymous-' + crypto.randomUUID();
            isAuthReady = true; // Mark as ready even with fallback ID to allow UI to proceed
        }
    } finally {
        // Dispatch event AFTER state is set, ensuring listeners get the correct state
        window.dispatchEvent(new Event('authReady'));
    }
}

// Start the authentication process immediately
authenticateUser();

/**
 * Gets the reference to the public chargingSessions collection.
 * Documents are stored in /artifacts/{appId}/public/data/chargingSessions
 * @returns {import("firebase/firestore").CollectionReference}
 */
export function getChargingSessionsCollection() {
    // Note: The collection path ensures global access as per Firestore security rules
    const collectionPath = `/artifacts/${appId}/public/data/chargingSessions`;
    return collection(db, collectionPath);
}
