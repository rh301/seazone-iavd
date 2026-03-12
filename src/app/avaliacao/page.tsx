"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getEvaluatableUsers } from "@/lib/permissions";
import { getQuestions, saveEvaluation, createEmptyAnswers, getEvaluations } from "@/lib/store";
import { Users, Search, ArrowRight, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import AppShell from "@/components/app-shell";

export default function NovaAvaliacao() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [evaluations, setEvaluations] = useState<ReturnType<typeof getEvaluations>>([]);
  const router = useRouter();

  useEffect(() => {
    setEvaluations(getEvaluations());
  }, []);

  if (!user) return null;

  const evaluatable = getEvaluatableUsers(user);

  if (evaluatable.length === 0) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <ShieldAlert className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900">Sem permissão</h2>
          <p className="text-gray-500 mt-1">
            Você não tem liderados diretos para avaliar.
          </p>
        </div>
      </AppShell>
    );
  }

  const filtered = evaluatable.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase())
  );

  function getEvalStatus(employeeId: string) {
    const existing = evaluations.find(
      (e) => e.employeeId === employeeId && e.evaluatorId === user!.id
    );
    if (!existing) return null;
    return existing;
  }

  function startOrContinue(employeeId: string) {
    const existing = getEvalStatus(employeeId);
    if (existing && existing.status === "em_andamento") {
      router.push(`/avaliacao/${existing.id}`);
      return;
    }
    if (existing && existing.status === "concluida") {
      if (!confirm("Essa pessoa já foi avaliada. Deseja criar uma nova avaliação?")) return;
    }
    const questions = getQuestions();
    const evalId = `eval_${Date.now()}`;
    saveEvaluation({
      id: evalId,
      employeeId,
      evaluatorId: user!.id,
      date: new Date().toISOString().split("T")[0],
      status: "em_andamento",
      answers: createEmptyAnswers(questions),
    });
    router.push(`/avaliacao/${evalId}`);
  }

  return (
    <AppShell>
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Avaliar equipe</h1>
          <p className="text-gray-500 mt-1">
            Selecione o colaborador que deseja avaliar
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, cargo ou departamento..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp) => {
            const evalData = getEvalStatus(emp.id);
            const isDone = evalData?.status === "concluida";
            const isInProgress = evalData?.status === "em_andamento";

            return (
              <button
                key={emp.id}
                onClick={() => startOrContinue(emp.id)}
                className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{emp.name}</h3>
                      <p className="text-xs text-gray-500">{emp.role}</p>
                      <p className="text-xs text-gray-400">{emp.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isDone && (
                      <span className="flex items-center gap-1 text-xs text-accent bg-accent/10 px-2 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Avaliado
                      </span>
                    )}
                    {isInProgress && (
                      <span className="flex items-center gap-1 text-xs text-secondary bg-secondary/10 px-2 py-1 rounded-full">
                        <Clock className="w-3 h-3" />
                        Em andamento
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
