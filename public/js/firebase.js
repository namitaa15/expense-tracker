// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyAMYfNAQUOBMiWKGIe5Jze7KPe6J8Ci6Qw", 
  authDomain: "expense-tracker-d1144.firebaseapp.com",
  databaseURL: "https://expense-tracker-d1144-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "expense-tracker-d1144",
  storageBucket: "expense-tracker-d1144.appspot.com",
  messagingSenderId: "902517077663",
  appId: "1:902517077663:web:aad894a4eaf216fd9354aa",
  measurementId: "G-E3BWPLRYB0"
};

// Initialize Firebase App
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully.");
} catch (error) {
  console.error("Error initializing Firebase:", error.message);
}

// Initialize Firebase services
let auth, database;
try {
  auth = getAuth(app);
  database = getDatabase(app);

  // Set session persistence globally to browserLocalPersistence
  auth.setPersistence(browserLocalPersistence).then(() => {
    console.log("Persistence set to browserLocalPersistence.");
  }).catch((error) => {
    console.error("Error setting persistence:", error.message);
  });

} catch (error) {
  console.error("Error initializing Firebase services:", error.message);
}

// Export the Firebase app and services
export { app, auth, database };