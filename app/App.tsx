/**
 * Eterny - Wellness Planning and Tracking App
 * React Native Mobile Application
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import { ToDoProvider } from './src/contexts/ToDoContext';
import { HabitProvider } from './src/contexts/HabitContext';

function App(): JSX.Element {
  console.log('🚀 App.tsx rendering...');
  
  const [showSplash, setShowSplash] = useState(true);
  
  // Initialize Google Sign-In
  useEffect(() => {
    console.log('🔧 Initializing Google Sign-In...');
    GoogleSignin.configure({
      webClientId: '231231514086-1ltso6j58bnd6t8510tuf32j3jmbd0dk.apps.googleusercontent.com',
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
      scopes: [
        'https://www.googleapis.com/auth/calendar'
      ]
    });
    console.log('✅ Google Sign-In initialized');
  }, []);
  
  const handleSplashFinish = () => {
    setShowSplash(false);
  };
  
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }
  
  return (
    <SafeAreaProvider>
      <HabitProvider>
        <ToDoProvider>
          <AppNavigator />
        </ToDoProvider>
      </HabitProvider>
    </SafeAreaProvider>
  );
}

export default App;
