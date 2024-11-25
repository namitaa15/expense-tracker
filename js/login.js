import { auth } from './firebase.js';
import { setPersistence, browserLocalPersistence, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// DOM Elements
const loginForm = document.getElementById("login-form");
const errorMessageDiv = document.getElementById("error-message");

// Handle login form submission
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Clear any previous error messages
    errorMessageDiv.textContent = '';

    try {
        // Set session persistence
        await setPersistence(auth, browserLocalPersistence);

        // Attempt login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Logged in successfully:", userCredential.user);

        // Redirect to the main page or dashboard
        window.location.href = "index.html";
    } catch (error) {
        // Handle errors during login
        console.error("Error during login:", error);

        // Display user-friendly error messages
        const errorCode = error.code;
        switch (errorCode) {
            case "auth/invalid-email":
                errorMessageDiv.textContent = "Invalid email address format.";
                break;
            case "auth/user-disabled":
                errorMessageDiv.textContent = "This user account has been disabled.";
                break;
            case "auth/user-not-found":
                errorMessageDiv.textContent = "No account found with this email.";
                break;
            case "auth/wrong-password":
                errorMessageDiv.textContent = "Incorrect password. Please try again.";
                break;
            default:
                errorMessageDiv.textContent = "Login failed. Please try again.";
        }
    }
});