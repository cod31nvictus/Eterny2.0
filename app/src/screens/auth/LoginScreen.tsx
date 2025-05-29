import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
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
          <Text style={styles.title}>Eterny</Text>
          <Text style={styles.subtitle}>Your Wellness Journey Starts Here</Text>
        </View>

        {/* Illustration */}
        <View style={styles.illustration}>
          <Text style={styles.emoji}>🌱</Text>
          <Text style={styles.illustrationText}>
            Plan, track, and optimize your daily wellness activities
          </Text>
        </View>

        {/* Google Sign In Button */}
        <TouchableOpacity
          style={[styles.signInButton, loading && styles.signInButtonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
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
    backgroundColor: '#f8fafc',
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  illustration: {
    alignItems: 'center',
    marginBottom: 48,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  illustrationText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
  signInButton: {
    backgroundColor: '#4285f4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#4285f4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signInButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  signInButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleIcon: {
    backgroundColor: '#fff',
    color: '#4285f4',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreen; 