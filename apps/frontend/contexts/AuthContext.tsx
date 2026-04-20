"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { setAuthToken } from "@/lib/api";

export type AuthUser = { id: string; email: string; role: string };

type AuthState = { token: string | null; user: AuthUser | null };

type AuthContextType = {
  token: string | null;
  user: AuthUser | null;
  userId: string | null;
  isSignedIn: boolean;
  isLoaded: boolean;
  getToken: () => Promise<string | null>;
  signIn: (token: string, user: AuthUser) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, user: null });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("auth");
    if (stored) {
      try {
        const parsed: AuthState = JSON.parse(stored);
        setState(parsed);
        setAuthToken(parsed.token);
      } catch {
        localStorage.removeItem("auth");
      }
    }
    setIsLoaded(true);
  }, []);

  const signIn = useCallback((token: string, user: AuthUser) => {
    const auth = { token, user };
    localStorage.setItem("auth", JSON.stringify(auth));
    setAuthToken(token);
    setState(auth);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem("auth");
    setAuthToken(null);
    setState({ token: null, user: null });
  }, []);

  const getToken = useCallback(() => Promise.resolve(state.token), [state.token]);

  return (
    <AuthContext.Provider
      value={{
        token: state.token,
        user: state.user,
        userId: state.user?.id ?? null,
        isSignedIn: !!state.token,
        isLoaded,
        getToken,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
