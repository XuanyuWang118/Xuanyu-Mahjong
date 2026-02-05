
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCQb-hLzvL539c-BhFETGQEkCexVCKJUws",
  authDomain: "xuanyu-mahjong.firebaseapp.com",
  projectId: "xuanyu-mahjong",
  storageBucket: "xuanyu-mahjong.firebasestorage.app",
  messagingSenderId: "449706616976",
  appId: "1:449706616976:web:59bb44472e79efd8625015"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
