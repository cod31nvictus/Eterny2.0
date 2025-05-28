import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { User } from '../types';

// Extend global interface for TypeScript
declare global {
  var authRefresh: (() => void) | undefined;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refreshAuth: () => Promise<void>;
  clearAllTokens: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('🏗️ AuthProvider function called');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  console.log('🏗️ AuthProvider state initialized - user:', user, 'loading:', loading);

  // Use useCallback to ensure stable function references
  const login = useCallback(async (token: string) => {
    try {
      console.log('🚀 Starting login process...');
      await AsyncStorage.setItem('token', token);
      console.log('💾 Token stored successfully');
      
      // For demo purposes, create a mock user
      const mockUser: User = {
        _id: '68355927d3d4668f04255b90',
        googleId: 'demo-google-id',
        name: 'Demo User',
        email: 'demo@eterny.com',
        picture: 'https://via.placeholder.com/150/6366f1/ffffff?text=DU',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setUser(mockUser);
      console.log('✅ Login successful, user set:', mockUser.name);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('🚪 Starting logout process...');
      await AsyncStorage.multiRemove(['token', 'authToken', 'googleAccessToken', 'user']);
      setUser(null);
      console.log('✅ Logout successful - all tokens cleared');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if storage fails
      setUser(null);
    }
  }, []);

  const clearAllTokens = useCallback(async () => {
    try {
      console.log('🧹 Clearing all stored tokens...');
      await AsyncStorage.multiRemove(['token', 'authToken', 'googleAccessToken', 'user']);
      setUser(null);
      setIsAuthenticated(false);
      console.log('✅ All tokens cleared and state reset');
    } catch (error) {
      console.error('❌ Error clearing tokens:', error);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    await checkAuthStatus();
  }, []);

  console.log('🔧 AuthProvider functions defined with useCallback:', {
    loginType: typeof login,
    logoutType: typeof logout,
    clearAllTokensType: typeof clearAllTokens,
    loginFunction: login,
    clearAllTokensFunction: clearAllTokens
  });

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Checking auth status...');
      
      // Get all AsyncStorage keys to debug
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('📱 All AsyncStorage keys:', allKeys);
      
      const token = await AsyncStorage.getItem('token');
      console.log('🔑 Token found:', !!token);
      console.log('🔑 Token preview:', token ? token.substring(0, 30) + '...' : 'null');
      console.log('🔑 Current user state:', user?.name || 'null');
      console.log('🔑 Current isAuthenticated:', !!user);
      
      if (token) {
        // For demo purposes, create a mock user when token exists
        const mockUser: User = {
          _id: '68355927d3d4668f04255b90',
          googleId: 'demo-google-id',
          name: 'Demo User',
          email: 'demo@eterny.com',
          picture: 'https://via.placeholder.com/150/6366f1/ffffff?text=DU',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        if (!user || user.name !== mockUser.name) {
          console.log('👤 Setting new user state...');
          setUser(mockUser);
        } else {
          console.log('👤 User already set, no change needed');
        }
        
        console.log('✅ User set:', mockUser.name);
        console.log('✅ isAuthenticated should now be:', true);
      } else {
        console.log('❌ No token found');
        if (user) {
          console.log('👤 Clearing user state...');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await AsyncStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
      console.log('🏁 Auth check complete, loading:', false);
    }
  };

  useEffect(() => {
    console.log('🚀 AuthProvider useEffect running...');
    checkAuthStatus();
    
    // Set up app state listener to re-check auth when app becomes active
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('📱 App became active, re-checking auth...');
        checkAuthStatus();
      }
    });
    
    // Set up periodic auth check (every 5 seconds) as fallback
    const intervalId = setInterval(() => {
      console.log('⏰ Periodic auth check...');
      checkAuthStatus();
    }, 5000);
    
    // Set up global refresh function for LoginScreen to trigger
    global.authRefresh = () => {
      console.log('🔄 Auth refresh triggered from login');
      setLoading(true);
      checkAuthStatus();
    };
    console.log('🌐 Global authRefresh function set up successfully');
    
    // Cleanup
    return () => {
      console.log('🧹 AuthProvider cleanup running...');
      subscription?.remove();
      clearInterval(intervalId);
      delete global.authRefresh;
    };
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    refreshAuth,
    clearAllTokens,
  };

  console.log('🔄 AuthProvider rendering with value:', { 
    isAuthenticated: !!user, 
    loading, 
    userName: user?.name || 'null',
    hasLogin: typeof value.login === 'function',
    hasClearAllTokens: typeof value.clearAllTokens === 'function',
    loginFunction: value.login,
    clearAllTokensFunction: value.clearAllTokens,
    valueKeys: Object.keys(value)
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 