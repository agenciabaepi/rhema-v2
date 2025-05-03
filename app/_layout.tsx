// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { useFonts } from 'expo-font';
import { onAuthStateChanged } from 'firebase/auth'; // <--- precisa disso
import { auth } from '../services/firebaseConfig'; // <--- e disso (onde você configurou o Firebase)
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';


SplashScreen.preventAutoHideAsync();

export let isMaster = false;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [localIsMaster, setLocalIsMaster] = useState(false);

  const [loaded] = useFonts({
    Inter_700Bold: require('../assets/fonts/Inter-Bold.ttf'),
    Inter_400Regular: require('../assets/fonts/Inter-Regular.ttf'),
  });

  
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      if (user?.email === 'lucas@hotmail.com') {
        setLocalIsMaster(true);
        isMaster = true;
      } else {
        setLocalIsMaster(false);
        isMaster = false;
      }
    });

    return unsubscribe;
  }, []);

  if (!loaded || isLoggedIn === null) return null;

  return (
    
    <GestureHandlerRootView style={{ flex: 1 }}>
      

    <BottomSheetModalProvider>
    
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style="auto" />
        
        <Stack screenOptions={{ headerShown: false }}>
          {isLoggedIn ? (
            <Stack.Screen name="(tabs)" />
          ) : (
            <>
              <Stack.Screen name="index" />
              <Stack.Screen name="welcome" />
              <Stack.Screen name="login" />
              <Stack.Screen name="cadastro" />

              
              
            </>
            
          )}
         
        </Stack>
        
      </ThemeProvider>
      
    </BottomSheetModalProvider>
    <Toast /> 
    </GestureHandlerRootView>

  );
}