import type { ReactNode } from "react";

import type { User } from "./hubhex";

export interface AuthContextValue {
  token: string;
  currentUser: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ token: string; user: User }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  setSession: (newToken: string, user: User, refreshToken?: string) => void;
}

export interface AuthProviderProps {
  children: ReactNode;
}
