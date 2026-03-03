import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config/environment";

const ACCESS_TOKEN_KEY = "eterny_access_token";
const REFRESH_TOKEN_KEY = "eterny_refresh_token";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: any;
  token?: string | null;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
    return this._request<T>(path, options, false);
  }

  private async _request<T = any>(
    path: string,
    options: RequestOptions,
    isRetry: boolean
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    const res = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (res.status === 401 && !isRetry && options.token) {
      try {
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const refreshRes = await fetch(`${this.baseUrl}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });
          if (refreshRes.ok) {
            const { accessToken: newToken } = await refreshRes.json();
            await AsyncStorage.setItem(ACCESS_TOKEN_KEY, newToken);
            return this._request<T>(path, { ...options, token: newToken }, true);
          }
        }
      } catch {
        // fall through to token clear
      }
      await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
    }

    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }

    if (!res.ok) {
      const message =
        (data.details ?? data.error) as string || `Request failed with ${res.status}`;
      throw new Error(message);
    }

    return data as T;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
