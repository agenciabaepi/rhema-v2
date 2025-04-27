// services/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAlSctM88UzePN6Ltb2b_S7PDy38NbA3SE",
  authDomain: "apprhema-9d049.firebaseapp.com",
  projectId: "apprhema-9d049",
  storageBucket: "apprhema-9d049.firebasestorage.app",
  messagingSenderId: "263944308981",
  appId: "1:263944308981:web:3e85a95d4cca40de4f9dbc"
};

// Inicializa o app apenas se ainda não estiver inicializado
const app = initializeApp(firebaseConfig);

// Persistência de login no dispositivo
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

export { auth, db };
