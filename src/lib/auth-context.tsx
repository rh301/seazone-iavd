"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";
import { User } from "./auth-types";
import { users } from "@/data/users";

interface AuthContextType {
  user: User | null;
  login: (userId: string) => void;
  loginWithGoogle: () => void;
  logout: () => void;
  isLoading: boolean;
  isOAuth: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  loginWithGoogle: () => {},
  logout: () => {},
  isLoading: true,
  isOAuth: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [demoUser, setDemoUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Resolve o usuário OAuth da session
  const oauthUser: User | null = (() => {
    if (!session?.user?.email) return null;
    const found = users.find(
      (u) => u.email.toLowerCase() === session.user!.email!.toLowerCase()
    );
    return found || null;
  })();

  // O usuário ativo é OAuth primeiro, depois demo
  const user = oauthUser || demoUser;
  const isOAuth = !!oauthUser;

  useEffect(() => {
    if (status === "loading") return;

    // Se não tem sessão OAuth, tenta carregar demo do localStorage
    if (!oauthUser) {
      const stored = localStorage.getItem("avd_current_user");
      if (stored) {
        const found = users.find((u) => u.id === stored);
        if (found) setDemoUser(found);
      }
    }
    setIsLoading(false);
  }, [status, oauthUser]);

  // Login demo (seleção de perfil)
  const login = useCallback((userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setDemoUser(found);
      localStorage.setItem("avd_current_user", userId);
    }
  }, []);

  // Login com Google OAuth
  const loginWithGoogle = useCallback(() => {
    nextAuthSignIn("google");
  }, []);

  // Logout (ambos os modos)
  const logout = useCallback(() => {
    if (oauthUser) {
      nextAuthSignOut({ redirectTo: "/login" });
    } else {
      setDemoUser(null);
      localStorage.removeItem("avd_current_user");
    }
  }, [oauthUser]);

  return (
    <AuthContext.Provider
      value={{ user, login, loginWithGoogle, logout, isLoading, isOAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
