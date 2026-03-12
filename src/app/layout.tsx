import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "Seazone AVD Insight",
  description: "Plataforma de avaliação de desempenho com IA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-surface">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
