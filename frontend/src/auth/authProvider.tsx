"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { axiosInstance } from "../utlis/axiosInstance";
import type { AuthProfile } from "../types/admin/access.types";

export const TOKEN_STORAGE_KEY = "token";

interface AuthContextType {
  user: AuthProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Stores the token and loads the profile; resolves with the profile (or null). */
  login: (token: string) => Promise<AuthProfile | null>;
  /** Clears the session. Pass a path to navigate to afterwards (default "/"). */
  logout: (redirectTo?: string) => void;
  checkAuth: () => Promise<AuthProfile | null>;
  /** Replaces the token without a loading state (e.g. after a password change). */
  replaceToken: (token: string) => void;
  /** Applies a profile returned by the API (e.g. after editing it). */
  setProfile: (profile: AuthProfile) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // storage unavailable — nothing to clear
    }
    setUser(null);
  }, []);

  const checkAuth = useCallback(async (): Promise<AuthProfile | null> => {
    const token = readToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return null;
    }

    try {
      const response = await axiosInstance.post<{ user?: AuthProfile }>(
        "/auth/status",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const profile = response.data.user ?? null;
      if (profile) {
        setUser(profile);
        return profile;
      }
      clearSession();
      return null;
    } catch {
      clearSession();
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  const login = useCallback(
    async (token: string) => {
      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } catch {
        // private mode without storage: the session lasts until reload
      }
      setIsLoading(true);
      return checkAuth();
    },
    [checkAuth]
  );

  const logout = useCallback(
    (redirectTo = "/") => {
      clearSession();
      if (typeof window !== "undefined") {
        window.location.assign(redirectTo);
      }
    },
    [clearSession]
  );

  const replaceToken = useCallback((token: string) => {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      checkAuth,
      replaceToken,
      setProfile: setUser,
    }),
    [user, isLoading, login, logout, checkAuth, replaceToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
