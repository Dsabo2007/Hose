// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4zsAlaijPhOooUN5FQup4DQfDHap3hbU",
  authDomain: "hose-3d55d.firebaseapp.com",
  projectId: "hose-3d55d",
  storageBucket: "hose-3d55d.firebasestorage.app",
  messagingSenderId: "415279827716",
  appId: "1:415279827716:web:d8c00c9888e90656e3de51",
  measurementId: "G-N01ZCNHMKH"
};

// Initialize Firebase using Compat SDK
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Make db global for other scripts to use
window.db = db;
