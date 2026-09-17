// ---- Conexión compartida a Firebase ----
// informarnos.js y wiki.js importan "db" y "auth" desde acá,
// así Firebase se inicializa una sola vez por página.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCAoxmKxlM-VfaSqO2dc268E5ErDRr1bu8",
  authDomain: "dawn-quest-web.firebaseapp.com",
  projectId: "dawn-quest-web",
  storageBucket: "dawn-quest-web.firebasestorage.app",
  messagingSenderId: "669790589335",
  appId: "1:669790589335:web:b2af282cbc47388aa474d2",
  measurementId: "G-H6C8NH91KZ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);