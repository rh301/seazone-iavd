"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { roleLabels, roleColors } from "@/lib/auth-types";
import { canCalibrate, isRH } from "@/lib/permissions";
import { LogOut, Loader2 } from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <nav className="bg-primary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold text-sm">
                SZ
              </div>
              <span className="text-lg font-semibold">IAVD</span>
            </a>
            <div className="flex items-center gap-6">
              <a
                href="/"
                className="text-white/80 hover:text-white transition text-sm font-medium"
              >
                Home
              </a>
              <a
                href="/avaliacao"
                className="text-white/80 hover:text-white transition text-sm font-medium"
              >
                Avaliar
              </a>
              <a
                href="/minhas-notas"
                className="text-white/80 hover:text-white transition text-sm font-medium"
              >
                Minhas Notas
              </a>
              <a
                href="/resultados"
                className="text-white/80 hover:text-white transition text-sm font-medium"
              >
                Resultados
              </a>
              {(canCalibrate(user) || ["diretor", "coordenador"].includes(user.role)) && (
                <a
                  href="/agenda-calibracao"
                  className="text-white/80 hover:text-white transition text-sm font-medium"
                >
                  Agenda
                </a>
              )}
              {canCalibrate(user) && (
                <a
                  href="/calibracao"
                  className="text-white/80 hover:text-white transition text-sm font-medium"
                >
                  Calibração
                </a>
              )}
              {isRH(user) && (
                <a
                  href="/admin/gestao"
                  className="text-white/80 hover:text-white transition text-sm font-medium"
                >
                  Gestão
                </a>
              )}

              <div className="h-6 w-px bg-white/20" />

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium leading-none">
                    {user.name}
                  </p>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 inline-block ${roleColors[user.role]}`}
                  >
                    {roleLabels[user.role]}
                  </span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                  className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </>
  );
}
