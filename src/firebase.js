// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBOw0v2Hm2RZCQ6Xm784t5g28igF40AORw",
  authDomain: "secret-santa-website-cbc1c.firebaseapp.com",
  projectId: "secret-santa-website-cbc1c",
  storageBucket: "secret-santa-website-cbc1c.firebasestorage.app",
  messagingSenderId: "1026273738747",
  appId: "1:1026273738747:web:62f9fc72386e25833b955e",
  measurementId: "G-KLK3FHT8GW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}
const auth = getAuth(app);

export { app, analytics, auth };
