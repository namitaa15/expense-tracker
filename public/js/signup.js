// signup.js
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

import { app } from "./firebase.js"; // Import the initialized app
const database = getDatabase(app); // Initialize Firebase Database
// Select DOM elements
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const signupForm = document.getElementById("signup-form");
const errorMessage = document.getElementById("error-message");

// Initialize Firebase Auth with the app
const auth = getAuth(app); // Pass the 'app' object to getAuth()

// Handle signup form submission
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value;
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  // Validate the form inputs
  if (!email || !password || !confirmPassword) {
    errorMessage.textContent = "All fields are required.";
    errorMessage.style.color = "red";
    return;
  }

  if (password !== confirmPassword) {
    errorMessage.textContent = "Passwords do not match.";
    errorMessage.style.color = "red";
    return;
  }

  try {
    // Create a new user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Initialize accountBalance in Firebase
    const userRef = ref(database, `users/${user.uid}`);
    await set(userRef, {
      accountBalance: 0.00, // Default balance
    });
    console.log("User signed up and accountBalance initialized.");

    // Redirect to the login page after successful signup
    window.location.href = "login.html";
  } catch (error) {
    // Handle signup errors (e.g., email already in use)
    errorMessage.textContent = error.message;
    errorMessage.style.color = "red";
  }
});