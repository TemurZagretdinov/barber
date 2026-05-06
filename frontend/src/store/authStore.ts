import type { LoginResponse, Role, User } from "../types/auth";

interface AuthState {
  token: string | null;
  user: User | null;
}

const STORAGE_KEY = "sharp-cuts-auth";

let state: AuthState = loadState();
const listeners = new Set<() => void>();

function loadState(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
}

function persist(next: AuthState) {
  state = next;
  if (next.token) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  listeners.forEach((listener) => listener());
}

export const authStore = {
  getState: () => state,
  getToken: () => state.token,
  getRole: (): Role | null => state.user?.role ?? null,
  isAuthenticated: (role?: Role) => Boolean(state.token && (!role || state.user?.role === role)),
  setSession: (session: LoginResponse) => persist({ token: session.access_token, user: session.user }),
  signOut: () => persist({ token: null, user: null }),
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

