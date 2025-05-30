import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config/environment';

const LoginScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      console.log('Starting Google Sign-In process...');
      
      // Configure Google Sign-In with the actual client ID
      GoogleSignin.configure({
        webClientId: config.GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
        scopes: [
          'https://www.googleapis.com/auth/calendar'
        ]
      });
      console.log('Google Sign-In configured');

      // Check if device supports Google Play Services
      console.log('Checking Google Play Services...');
      await GoogleSignin.hasPlayServices();
      console.log('Google Play Services available');
      
      // Sign in with Google
      console.log('Attempting Google Sign-In...');
      const userInfo = await GoogleSignin.signIn();
      console.log('Google Sign-In successful:', userInfo);
      
      // Get the ID token
      console.log('Getting tokens...');
      const tokens = await GoogleSignin.getTokens();
      console.log('Tokens received:', { hasIdToken: !!tokens.idToken, hasAccessToken: !!tokens.accessToken });
      
      // Send token to backend for verification
      console.log('Sending tokens to backend...');
      const response = await fetch(`${config.AUTH_BASE_URL}/google/mobile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: tokens.idToken,
          accessToken: tokens.accessToken,
          refreshToken: userInfo.serverAuthCode,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend response error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Backend response:', data);
      
      if (data.success && data.token) {
        await login(data.token);
        Alert.alert('Success', 'Google sign-in successful!');
      } else {
        throw new Error('Invalid response from server');
      }
      
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      
      let errorMessage = 'Unable to sign in with Google. Please try again.';
      
      if (error.code === 'SIGN_IN_CANCELLED') {
        errorMessage = 'Sign-in was cancelled.';
      } else if (error.code === 'IN_PROGRESS') {
        errorMessage = 'Sign-in is already in progress.';
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        errorMessage = 'Google Play Services not available on this device.';
      } else if (error.code === 'SIGN_IN_REQUIRED') {
        errorMessage = 'Google Sign-In configuration error.';
      } else {
        errorMessage = `Google Sign-In failed: ${error.message || error.code || 'Unknown error'}`;
      }
      
      Alert.alert('Sign In Failed', errorMessage, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Header */}
        <View style={styles.header}>
          <Text style={styles.subtitle}>Your Complete Wellness App</Text>
          <Image
            source={require('../../assets/images/eterny-logo-black-cropped.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>You. Forever.</Text>
        </View>

        {/* Google Sign In Button */}
        <TouchableOpacity
          style={[styles.signInButton, loading && styles.signInButtonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.signInButtonContent}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.signInButtonText}>Continue with Google</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  subtitle: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 240,
    height: 180,
    marginTop: 24,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 32,
  },
  signInButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  signInButtonDisabled: {
    backgroundColor: '#333333',
    borderColor: '#E0E0E0',
  },
  signInButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleIcon: {
    backgroundColor: '#FFFFFF',
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    width: 32,
    height: 32,
    textAlign: 'center',
    lineHeight: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreen; 