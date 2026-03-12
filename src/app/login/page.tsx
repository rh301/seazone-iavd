"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { users } from "@/data/users";
import { Role, roleLabels, roleColors } from "@/lib/auth-types";
import { LogIn, Shield, Users, Building2 } from "lucide-react";

const roleOrder: Role[] = ["c_level", "rh", "diretor", "coordenador", "colaborador"];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const filteredUsers = selectedRole
    ? users.filter((u) => u.role === selectedRole)
    : [];

  function handleLogin(userId: string) {
    login(userId);
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">SZ</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AVD Insight</h1>
          <p className="text-gray-500 mt-1">
            Selecione seu perfil para acessar a plataforma
          </p>
        </div>

        {/* Role selection */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
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
                  <p className="text-xs text-gray-400 mt-2">{count} usuário{count !== 1 ? "s" : ""}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* User selection */}
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

        <p className="text-center text-xs text-gray-400 mt-6">
          Ambiente de demonstração — selecione um perfil para simular o acesso
        </p>
      </div>
    </div>
  );
}
