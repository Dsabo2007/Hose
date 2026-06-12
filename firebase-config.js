// Firebase Configuration
// IMPORTANT: You MUST configure Firestore Security Rules in Firebase Console > Firestore > Rules
// Otherwise anyone can read/write/delete your database
const firebaseConfig = {
  apiKey: "AIzaSyC4zsAlaijPhOooUN5FQup4DQfDHap3hbU",
  authDomain: "hose-3d55d.firebaseapp.com",
  projectId: "hose-3d55d",
  storageBucket: "hose-3d55d.firebasestorage.app",
  messagingSenderId: "415279827716",
  appId: "1:415279827716:web:d8c00c9888e90656e3de51",
  measurementId: "G-N01ZCNHMKH"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

// Enable offline persistence for instant subsequent page loads
db.enablePersistence({ synchronizeTabs: true }).catch(err => {
    if (err.code !== 'failed-precondition') {
        console.warn('Firestore persistence:', err.message);
    }
});

window.db = db;
