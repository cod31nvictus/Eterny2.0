import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { User } from '../types';
import config from '../config/environment';

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Use useCallback to ensure stable function references
  const login = useCallback(async (token: string) => {
    try {
      await AsyncStorage.setItem('token', token);
      
      // Fetch real user data from backend
      await fetchUserData();
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'authToken', 'googleAccessToken', 'user']);
      setUser(null);
    } catch (error) {
      // Still clear local state even if storage fails
      setUser(null);
    }
  }, []);

  const clearAllTokens = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'authToken', 'googleAccessToken', 'user']);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    await checkAuthStatus();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await fetch(`${config.AUTH_BASE_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        
        const user: User = {
          _id: userData.id,
          googleId: userData.googleId || '',
          name: userData.name,
          email: userData.email,
          picture: userData.profilePicture || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setUser(user);
      } else if (response.status === 429) {
        // Don't clear token or user state on rate limiting
        return;
      } else {
        await AsyncStorage.removeItem('token');
        setUser(null);
      }
    } catch (error) {
      // Only clear token on actual errors, not network issues
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        return;
      }
      await AsyncStorage.removeItem('token');
      setUser(null);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (token) {
        // Fetch real user data from backend
        await fetchUserData();
      } else {
        if (user) {
          setUser(null);
        }
      }
    } catch (error) {
      await AsyncStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
    
    // Set up app state listener to re-check auth when app becomes active
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkAuthStatus();
      }
    });
    
    // Set up global refresh function for LoginScreen to trigger
    global.authRefresh = () => {
      setLoading(true);
      checkAuthStatus();
    };
    
    // Cleanup
    return () => {
      subscription?.remove();
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 