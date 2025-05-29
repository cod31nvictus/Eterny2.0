/**
 * Eterny - Wellness Planning and Tracking App
 * React Native Mobile Application
 *
 * @format
 */

import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AppNavigator from './src/navigation/AppNavigator';

function App(): JSX.Element {
  console.log('🚀 App.tsx rendering...');
  
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
  
  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
