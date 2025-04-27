// app/index.js
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { auth } from '../services/firebaseConfig';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/(tabs)/bible'); // vai direto pra Bíblia se logado
      } else {
        router.replace('/welcome'); // senão, vai pro welcome
      }
    });

    return unsubscribe;
  }, []);

  return null;
}
