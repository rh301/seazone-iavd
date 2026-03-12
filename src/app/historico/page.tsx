"use client";

import { useEffect, useState } from "react";
import { Evaluation } from "@/lib/types";
import { getEvaluations, getQuestions } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { canViewEvaluation } from "@/lib/permissions";
import { users as allUsers } from "@/data/users";
import { roleLabels, roleColors } from "@/lib/auth-types";
import {
  Clock,
  CheckCircle2,
  ChevronRight,
  FileText,
  AlertCircle,
  Eye,
  Filter,
} from "lucide-react";
import AppShell from "@/components/app-shell";

type StatusFilter = "todas" | "em_andamento" | "concluida" | "calibrada";

export default function Historico() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas");
  const [departmentFilter, setDepartmentFilter] = useState<string>("todas");

  useEffect(() => {
    setEvaluations(getEvaluations());
  }, []);

  if (!user) return null;

  const questions = getQuestions();

  // Filter evaluations based on permissions
  const visibleEvaluations = evaluations.filter((e) =>
    canViewEvaluation(user, e.employeeId, e.evaluatorId)
  );

  // Get unique departments from visible evaluations
  const departments = [
    ...new Set(
      visibleEvaluations
        .map((e) => allUsers.find((u) => u.id === e.employeeId)?.department)
        .filter(Boolean)
    ),
  ];

  // Apply filters
  const filtered = visibleEvaluations
    .filter((e) => statusFilter === "todas" || e.status === statusFilter)
    .filter((e) => {
      if (departmentFilter === "todas") return true;
      const emp = allUsers.find((u) => u.id === e.employeeId);
      return emp?.department === departmentFilter;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getEmployee = (id: string) => allUsers.find((e) => e.id === id);
  const getEvaluator = (id: string) => allUsers.find((e) => e.id === id);

  const getAvgScore = (eval_: Evaluation) => {
    const scores = eval_.answers
      .map((a) => a.score)
      .filter((s): s is number => s !== null);
    return scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : "—";
  };

  const statusConfig = {
    em_andamento: {
      label: "Em andamento",
      icon: Clock,
      color: "text-secondary bg-secondary/10",
    },
    concluida: {
      label: "Concluída",
      icon: CheckCircle2,
      color: "text-accent bg-accent/10",
    },
    calibrada: {
      label: "Calibrada",
      icon: FileText,
      color: "text-primary bg-primary/10",
    },
  };

  return (
    <AppShell>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Histórico</h1>
            <p className="text-gray-500 mt-1">
              {user.role === "c_level" || user.role === "rh"
                ? "Todas as avaliações da empresa"
                : user.role === "diretor"
                ? `Avaliações da área de ${user.department}`
                : "Avaliações da sua equipe"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Eye className="w-3.5 h-3.5" />
            {visibleEvaluations.length} avaliação(ões) visíveis
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg bg-white"
            >
              <option value="todas">Todos os status</option>
              <option value="em_andamento">Em andamento</option>
              <option value="concluida">Concluída</option>
              <option value="calibrada">Calibrada</option>
            </select>
          </div>
          {departments.length > 1 && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg bg-white"
            >
              <option value="todas">Todas as áreas</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
            <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">
              {visibleEvaluations.length === 0
                ? "Nenhuma avaliação encontrada."
                : "Nenhum resultado para os filtros selecionados."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((eval_) => {
              const emp = getEmployee(eval_.employeeId);
              const evaluator = getEvaluator(eval_.evaluatorId);
              const status = statusConfig[eval_.status];
              const StatusIcon = status.icon;
              const answered = eval_.answers.filter((a) => a.score !== null).length;
              const isMyEval = eval_.evaluatorId === user.id;

              return (
                <a
                  key={eval_.id}
                  href={
                    isMyEval && eval_.status === "em_andamento"
                      ? `/avaliacao/${eval_.id}`
                      : `/historico/${eval_.id}`
                  }
                  className={`group block bg-white rounded-xl p-5 shadow-sm border transition border-gray-100 hover:shadow-md hover:border-primary/10`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                        {emp?.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {emp?.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {emp ? roleLabels[emp.role] : ""} · {emp?.department}
                        </p>
                        {evaluator && evaluator.id !== user.id && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Avaliado por{" "}
                            <span className="font-medium">{evaluator.name}</span>
                          </p>
                        )}
                        {isMyEval && (
                          <span className="text-[10px] font-medium text-primary bg-primary/5 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            Minha avaliação
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">
                          {getAvgScore(eval_)}
                        </p>
                        <p className="text-xs text-gray-400">Nota média</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">
                          {answered}/{questions.length}
                        </p>
                        <p className="text-xs text-gray-400">Respondidas</p>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.color}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(eval_.date).toLocaleDateString("pt-BR")}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition" />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
