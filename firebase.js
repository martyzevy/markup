import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {getFirestore} from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDRRjrQwZ0eGEZkt7F45wvIeJg4lbiUEU0",
    authDomain: "markup-f62af.firebaseapp.com",
    projectId: "markup-f62af",
    storageBucket: "markup-f62af.firebasestorage.app",
    messagingSenderId: "31327770122",
    appId: "1:31327770122:web:86f1931b3367bbbf6f71f3",
    measurementId: "G-8NMC8CJP48"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };