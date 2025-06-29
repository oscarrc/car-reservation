// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDNTYgOa0N-WxaiD_O1UozFVtReIZxcoTc",
  authDomain: "car-management-4fc0a.firebaseapp.com",
  projectId: "car-management-4fc0a",
  storageBucket: "car-management-4fc0a.firebasestorage.app",
  messagingSenderId: "160521121979",
  appId: "1:160521121979:web:d01f214b888936b619b99e",
  measurementId: "G-Z2Z7ZM4WF8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;