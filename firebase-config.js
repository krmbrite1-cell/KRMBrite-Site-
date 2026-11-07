// ============================================
// KRM Brite - Firebase Configuration
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyC4ETMt6eBdu6Gr-aFPHBwVF1cXbRB0hno",
  authDomain: "krm-brite-ecommerce.firebaseapp.com",
  projectId: "krm-brite-ecommerce",
  storageBucket: "krm-brite-ecommerce.firebasestorage.app",
  messagingSenderId: "143013703691",
  appId: "1:143013703691:web:edbe6b4b655c9022c4d70e",
  measurementId: "G-G29XJWDW8X"
};

// Initialize Firebase (compat mode - works with plain <script> tags)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Global Firebase references - used across all pages
const db = firebase.firestore();
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();
// Storage — init if the SDK is loaded (product page & admin page)
const storage = (typeof firebase.storage === 'function') ? firebase.storage() : null;
