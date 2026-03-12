"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "./auth-types";
import { users } from "@/data/users";

interface AuthContextType {
  user: User | null;
  login: (userId: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("avd_current_user");
    if (stored) {
      const found = users.find((u) => u.id === stored);
      if (found) setUser(found);
    }
    setIsLoading(false);
  }, []);

  function login(userId: string) {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setUser(found);
      localStorage.setItem("avd_current_user", userId);
    }
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("avd_current_user");
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
