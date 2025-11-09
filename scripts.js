import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- YOUR FIREBASE CONFIGURATION (USED AS FALLBACK FOR GITHUB PAGES) ---
const hardcodedFirebaseConfig = {
    apiKey: "AIzaSyDJQbgJK4GpvmLEchh0-2mWjrUW3ZAN2QI",
    authDomain: "ev-charger-monitor-85a48.firebaseapp.com",
    projectId: "ev-charger-monitor-85a48",
    storageBucket: "ev-charger-monitor-85a48.firebasestorage.app",
    messagingSenderId: "22222071413",
    appId: "1:22222071413:web:d5a26ffd2a9014cc10fa3c",
    measurementId: "G-PYKSBZ6XHW"
};
// --------------------------------------------------------------------------


// --- MANDATORY PLATFORM GLOBAL VARIABLES ---
// We prioritize the environment's config, falling back to the hardcoded config for GitHub Pages deployment.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : hardcodedFirebaseConfig;

// Use the environment's app ID or fallback to the projectId from the hardcoded config.
const appId = typeof __app_id !== 'undefined' ? __app_id : hardcodedFirebaseConfig.projectId;

const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Enable Firestore logging for debugging
setLogLevel('debug'); 

let currentUserId = null;
let isAuthReady = false;

// Authenticate the user and set up the global user ID
async function authenticateUser() {
    try {
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            // Sign in anonymously if no custom token is provided
            await signInAnonymously(auth);
        }
    } catch (error) {
        console.error("Authentication Error:", error);
    }
}

// Listen for Auth State Changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
    } else {
        // Fallback for non-auth environment, though auth should succeed above
        currentUserId = crypto.randomUUID(); 
    }
    isAuthReady = true;
    console.log(`Auth Ready. User ID: ${currentUserId}`);

    // Dispatch a custom event once auth is ready so other modules (HTML files) can start Firestore operations
    window.dispatchEvent(new CustomEvent('authReady'));
});

// Run authentication immediately
authenticateUser();

// Function to get the correct collection reference path
function getChargingSessionsCollection() {
    // Public data path required by the platform: /artifacts/{appId}/public/data/collection_name
    return collection(db, `artifacts/${appId}/public/data/chargingSessions`);
}

// Export the necessary objects and variables
export { db, auth, getChargingSessionsCollection, isAuthReady, currentUserId, signInAnonymously };
