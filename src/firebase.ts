import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

//Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxdMQDkiH4bidVg2MWZ_yGO9G-vryDt8o",
  authDomain: "landiq-9ec70.firebaseapp.com",
  projectId: "landiq-9ec70",
  storageBucket: "landiq-9ec70.firebasestorage.app",
  messagingSenderId: "522870379961",
  appId: "1:522870379961:web:134783af30b5283ba19268"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db };
export default app;
