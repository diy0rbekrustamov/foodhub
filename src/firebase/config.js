import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "SENING_API_KEY",
  authDomain: "proyekt.firebaseapp.com",
  projectId: "proyekt-id",
  //...
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
