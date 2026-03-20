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
import { findUser, findUserByName, getAllUsers, setManagerOverrides } from "./org-tree";
import { fetchManagerOverrides } from "./db";

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = session.user as any;
    const userName = s.userName || session.user.name || "";

    // Try to find by name match in the org data (exact)
    if (userName) {
      const found = findUserByName(userName);
      if (found) return found;
    }

    // Try to find by userId from JWT (set in auth.ts callback)
    if (s.userId && !s.userId.startsWith("oauth_")) {
      const found = findUser(s.userId);
      if (found) return found;
    }

    // Fallback: create a user from session data (domínio autorizado mas fora do organograma)
    const fallbackId = s.userId || `oauth_${session.user.email!.split("@")[0]}`;
    return {
      id: fallbackId,
      name: userName || session.user.email!.split("@")[0],
      email: session.user.email!,
      role: (s.role || "colaborador") as User["role"],
      department: s.department || s.sector || "Geral",
      sector: s.sector || s.department || "Geral",
      cargo: "",
      photoUrl: session.user.image || null,
      slackUrl: null,
      managerId: null,
    };
  })();

  // O usuário ativo é OAuth primeiro, depois demo
  const user = oauthUser || demoUser;
  const isOAuth = !!oauthUser;

  useEffect(() => {
    if (status === "loading") return;

    async function init() {
      // Load manager overrides from DB into org-tree cache
      try {
        const overrides = await fetchManagerOverrides();
        setManagerOverrides(overrides);
      } catch { /* ignore */ }

      // Se não tem sessão OAuth, tenta carregar demo do localStorage
      if (!oauthUser) {
        const stored = localStorage.getItem("avd_current_user");
        if (stored) {
          const found = findUser(stored);
          if (found) setDemoUser(found);
        }
      }
      setIsLoading(false);
    }
    init();
  }, [status, oauthUser]);

  // Login demo (seleção de perfil)
  const login = useCallback((userId: string) => {
    const found = findUser(userId);
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
