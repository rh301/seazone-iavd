"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/lib/auth-context";
import HelpChat from "./help-chat";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        {children}
        <HelpChat />
      </AuthProvider>
    </SessionProvider>
  );
}
