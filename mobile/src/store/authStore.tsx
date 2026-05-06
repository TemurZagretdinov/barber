import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { TOKEN_STORAGE_KEY } from "../api/client";
import type { LoginResponse, Role, User } from "../types/auth";

const USER_STORAGE_KEY = "sharp-cuts-mobile-user";

interface AuthContextValue {
  loading: boolean;
  token: string | null;
  user: User | null;
  role: Role | null;
  setSession: (session: LoginResponse) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function restore() {
      const [savedToken, savedUser] = await Promise.all([
        AsyncStorage.getItem(TOKEN_STORAGE_KEY),
        AsyncStorage.getItem(USER_STORAGE_KEY),
      ]);
      setToken(savedToken);
      setUser(savedUser ? (JSON.parse(savedUser) as User) : null);
      setLoading(false);
    }
    restore().catch(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      token,
      user,
      role: user?.role ?? null,
      setSession: async (session: LoginResponse) => {
        await AsyncStorage.multiSet([
          [TOKEN_STORAGE_KEY, session.access_token],
          [USER_STORAGE_KEY, JSON.stringify(session.user)],
        ]);
        setToken(session.access_token);
        setUser(session.user);
      },
      signOut: async () => {
        await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
        setToken(null);
        setUser(null);
      },
    }),
    [loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
