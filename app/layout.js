// app/layout.js
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RootLayout() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/(tabs)/bible'); // Se logado, vai para as Tabs normais (Bíblia etc)
      } else {
        router.replace('/login'); // Se não logado, vai para login
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  if (checkingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#d68536" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ marginLeft: 16 }}>
            <Ionicons name="menu" size={28} color="#d68536" />
          </TouchableOpacity>
        ),
        headerTitleAlign: 'center',
      })}
    />
  );
}
