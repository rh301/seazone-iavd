"use client";

import { useEffect, useState } from "react";
import { Evaluation } from "@/lib/types";
import { getEvaluations, getQuestions } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { canCalibrate } from "@/lib/permissions";
import { users as allUsers } from "@/data/users";
import { roleLabels } from "@/lib/auth-types";
import {
  Scale,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Filter,
  BarChart3,
  Users,
} from "lucide-react";
import AppShell from "@/components/app-shell";

type DeptFilter = string;

export default function CalibracaoPage() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  const [deptFilter, setDeptFilter] = useState<DeptFilter>("todas");

  useEffect(() => {
    setEvaluations(getEvaluations());
  }, []);

  if (!user) return null;

  if (!canCalibrate(user)) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <ShieldAlert className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900">
            Sem permissão
          </h2>
          <p className="text-gray-500 mt-1">
            Apenas C-Level e RH podem acessar a calibração.
          </p>
        </div>
      </AppShell>
    );
  }

  const questions = getQuestions();

  // Apenas avaliações concluídas ou já calibradas
  const eligible = evaluations.filter(
    (e) => e.status === "concluida" || e.status === "calibrada"
  );

  // Departamentos únicos
  const departments = [
    ...new Set(
      eligible
        .map((e) => allUsers.find((u) => u.id === e.employeeId)?.department)
        .filter(Boolean)
    ),
  ] as string[];

  // Filtrar por departamento
  const filtered =
    deptFilter === "todas"
      ? eligible
      : eligible.filter((e) => {
          const emp = allUsers.find((u) => u.id === e.employeeId);
          return emp?.department === deptFilter;
        });

  // Estatísticas
  const totalConcluidas = filtered.filter(
    (e) => e.status === "concluida"
  ).length;
  const totalCalibradas = filtered.filter(
    (e) => e.status === "calibrada"
  ).length;

  // Distribuição geral de notas
  const allScores = filtered.flatMap((e) =>
    e.answers.map((a) => a.score).filter((s): s is number => s !== null)
  );
  const scoreDist = [1, 2, 3, 4, 5].map(
    (s) => allScores.filter((sc) => sc === s).length
  );
  const maxCount = Math.max(...scoreDist, 1);

  // Média por critério
  const avgByQuestion = questions.map((q) => {
    const scores = filtered.flatMap((e) => {
      const answer = e.answers.find((a) => a.questionId === q.id);
      return answer?.score ? [answer.score] : [];
    });
    const avg =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;
    return { question: q, avg, count: scores.length };
  });

  return (
    <AppShell>
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Scale className="w-7 h-7 text-primary" />
            Calibração
          </h1>
          <p className="text-gray-500 mt-1">
            Revise e calibre as avaliações concluídas para garantir justiça
            entre áreas
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {totalConcluidas}
                </p>
                <p className="text-sm text-gray-500">Aguardando calibração</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {totalCalibradas}
                </p>
                <p className="text-sm text-gray-500">Já calibradas</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {allScores.length > 0
                    ? (
                        allScores.reduce((a, b) => a + b, 0) /
                        allScores.length
                      ).toFixed(1)
                    : "—"}
                </p>
                <p className="text-sm text-gray-500">Nota média geral</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtro */}
        <div className="flex items-center gap-3 mb-6">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg bg-white"
          >
            <option value="todas">Todas as áreas</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Distribuição geral de notas */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Distribuição geral de notas
          </h2>
          <div className="flex items-end gap-3 h-32">
            {[1, 2, 3, 4, 5].map((score, i) => {
              const count = scoreDist[i];
              const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div key={score} className="flex-1 flex flex-col items-center">
                  <span className="text-xs font-medium text-gray-600 mb-1">
                    {count}
                  </span>
                  <div
                    className={`w-full rounded-t-lg score-${score} transition-all`}
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="text-xs text-gray-500 mt-2">
                    Nota {score}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Média por critério */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Média por critério
          </h2>
          <div className="space-y-3">
            {avgByQuestion.map(({ question: q, avg, count }) => (
              <div
                key={q.id}
                className="flex items-center gap-4"
              >
                <div className="w-40 text-sm text-gray-700 truncate">
                  {q.title}
                </div>
                <div className="flex-1 bg-gray-100 rounded-full h-3 relative">
                  <div
                    className="h-3 rounded-full bg-primary transition-all"
                    style={{ width: `${avg > 0 ? (avg / 5) * 100 : 0}%` }}
                  />
                </div>
                <div className="w-16 text-right">
                  <span className="text-sm font-bold text-gray-900">
                    {avg > 0 ? avg.toFixed(1) : "—"}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">
                    ({count})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de avaliações */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Avaliações para calibrar
        </h2>
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
            <Scale className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">
              Nenhuma avaliação concluída para calibrar.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered
              .sort((a, b) => {
                // Concluídas primeiro (aguardando calibração)
                if (a.status === "concluida" && b.status === "calibrada")
                  return -1;
                if (a.status === "calibrada" && b.status === "concluida")
                  return 1;
                return 0;
              })
              .map((eval_) => {
                const emp = allUsers.find((u) => u.id === eval_.employeeId);
                const evaluator = allUsers.find(
                  (u) => u.id === eval_.evaluatorId
                );
                const scores = eval_.answers
                  .map((a) => a.score)
                  .filter((s): s is number => s !== null);
                const avg =
                  scores.length > 0
                    ? (
                        scores.reduce((a, b) => a + b, 0) / scores.length
                      ).toFixed(1)
                    : "—";
                const isCalibrated = eval_.status === "calibrada";

                return (
                  <a
                    key={eval_.id}
                    href={`/calibracao/${eval_.id}`}
                    className={`group block bg-white rounded-xl p-5 shadow-sm border transition ${
                      isCalibrated
                        ? "border-accent/20 bg-accent/5"
                        : "border-gray-100 hover:shadow-md hover:border-primary/20"
                    }`}
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
                            {emp ? roleLabels[emp.role] : ""} ·{" "}
                            {emp?.department}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Avaliado por{" "}
                            <span className="font-medium">
                              {evaluator?.name}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">
                            {avg}
                          </p>
                          <p className="text-xs text-gray-400">Média</p>
                        </div>
                        {isCalibrated ? (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-accent bg-accent/10">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Calibrada
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-secondary bg-secondary/10">
                            <Scale className="w-3.5 h-3.5" />
                            Pendente
                          </span>
                        )}
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition" />
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
