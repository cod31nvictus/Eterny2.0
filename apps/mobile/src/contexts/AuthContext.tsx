import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "../services/apiClient";

type AuthContextType = {
  loading: boolean;
  accessToken: string | null;
  login: (phone: string, password: string) => Promise<void>;
  loginWithTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const ACCESS_TOKEN_KEY = "eterny_access_token";
export const REFRESH_TOKEN_KEY = "eterny_refresh_token";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
        if (stored) {
          setAccessToken(stored);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loginWithTokens = useCallback(async (newAccessToken: string, refreshToken: string) => {
    setAccessToken(newAccessToken);
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const data = await apiClient.request<{
      accessToken: string;
      refreshToken: string;
    }>("/auth/login", {
      method: "POST",
      body: { phone, password },
    });

    await loginWithTokens(data.accessToken, data.refreshToken);
  }, [loginWithTokens]);

  const logout = useCallback(async () => {
    setAccessToken(null);
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  }, []);

  const value: AuthContextType = {
    loading,
    accessToken,
    login,
    loginWithTokens,
    logout,
    isAuthenticated: !!accessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
