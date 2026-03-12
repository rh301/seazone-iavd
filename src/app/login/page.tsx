"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { users } from "@/data/users";
import { Role, roleLabels, roleColors } from "@/lib/auth-types";
import { LogIn, Shield, Users, Building2, AlertTriangle, ChevronDown } from "lucide-react";

const roleOrder: Role[] = ["c_level", "rh", "diretor", "coordenador", "colaborador"];

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  const filteredUsers = selectedRole
    ? users.filter((u) => u.role === selectedRole)
    : [];

  function handleLogin(userId: string) {
    login(userId);
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">SZ</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AVD Insight</h1>
          <p className="text-gray-500 mt-1">
            Plataforma de avaliação de desempenho
          </p>
        </div>

        {/* Error message */}
        {error === "unauthorized" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Acesso não autorizado
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Seu email não está cadastrado na plataforma. Entre em contato com o RH.
              </p>
            </div>
          </div>
        )}

        {/* Google OAuth login */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 text-center">
            Entrar com sua conta corporativa
          </h2>
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-primary/30 hover:bg-primary/5 transition font-medium text-gray-700"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Entrar com Google
          </button>
          <p className="text-xs text-gray-400 mt-3 text-center">
            Use seu email @seazone.com.br
          </p>
        </div>

        {/* Demo mode toggle */}
        <div className="text-center">
          <button
            onClick={() => setShowDemo(!showDemo)}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showDemo ? "rotate-180" : ""}`}
            />
            {showDemo ? "Esconder modo demonstração" : "Modo demonstração"}
          </button>
        </div>

        {/* Demo login (collapsible) */}
        {showDemo && (
          <div className="mt-4 space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Tipo de acesso
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {roleOrder.map((role) => {
                  const count = users.filter((u) => u.role === role).length;
                  return (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`p-3 rounded-lg border-2 text-center transition ${
                        selectedRole === role
                          ? "border-primary bg-primary/5"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[role]}`}
                      >
                        {roleLabels[role]}
                      </span>
                      <p className="text-xs text-gray-400 mt-2">
                        {count} usuário{count !== 1 ? "s" : ""}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedRole && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Entrar como
                </h2>
                <div className="space-y-2">
                  {filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleLogin(u.id)}
                      className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                          {u.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Building2 className="w-3 h-3" />
                            {u.department}
                            <span className="text-gray-300">·</span>
                            {u.email}
                          </div>
                        </div>
                      </div>
                      <LogIn className="w-4 h-4 text-gray-300 group-hover:text-primary transition" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-center text-xs text-gray-400">
              Ambiente de demonstração — selecione um perfil para simular o acesso
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
