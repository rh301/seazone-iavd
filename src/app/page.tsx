"use client";

import { useEffect, useState, useRef } from "react";
import {
  ClipboardCheck,
  TrendingUp,
  ArrowRight,
  Brain,
  Eye,
  Star,
  Users,
  UserCheck,
} from "lucide-react";
import { getQuestions } from "@/lib/store";
import { fetchEvaluations, fetchPeerAssignments } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { getRequiredEvaluations, canManageQuestions } from "@/lib/permissions";
import { Evaluation, EvaluationType, evaluationTypeLabels, evaluationTypeColors } from "@/lib/types";
import { useRouter } from "next/navigation";
import AppShell from "@/components/app-shell";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [tasksByType, setTasksByType] = useState<Record<EvaluationType, { total: number; completed: number }>>({
    auto: { total: 0, completed: 0 },
    gestor: { total: 0, completed: 0 },
    par: { total: 0, completed: 0 },
    liderado: { total: 0, completed: 0 },
  });

  useEffect(() => {
    if (!user) return;
    async function load() {
      const evals = await fetchEvaluations();
      setEvaluations(evals);

      const assignments = await fetchPeerAssignments();
      const tasks = getRequiredEvaluations(user!.id, assignments);
      setTotalTasks(tasks.length);

      const byType: Record<EvaluationType, { total: number; completed: number }> = {
        auto: { total: 0, completed: 0 },
        gestor: { total: 0, completed: 0 },
        par: { total: 0, completed: 0 },
        liderado: { total: 0, completed: 0 },
      };

      for (const task of tasks) {
        byType[task.evaluationType].total++;
        const done = evals.find(
          (e) =>
            e.evaluatorId === user!.id &&
            e.employeeId === task.evaluateeId &&
            e.evaluationType === task.evaluationType &&
            (e.status === "concluida" || e.status === "calibrada")
        );
        if (done) byType[task.evaluationType].completed++;
      }

      setTasksByType(byType);
    }
    load();
  }, [user]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  if (!user) return null;

  const canAdmin = canManageQuestions(user);

  const totalCompleted = Object.values(tasksByType).reduce((s, t) => s + t.completed, 0);
  const totalPending = totalTasks - totalCompleted;
  const progress = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;

  // Average score
  const myEvals = evaluations.filter((e) => e.evaluatorId === user.id && (e.status === "concluida" || e.status === "calibrada"));
  let totalScore = 0;
  let scoreCount = 0;
  myEvals.forEach((e) => {
    e.answers.forEach((a) => {
      if (a.score) { totalScore += a.score; scoreCount++; }
    });
  });
  const avgScore = scoreCount > 0 ? totalScore / scoreCount : 0;

  const typeOrder: EvaluationType[] = ["auto", "gestor", "par", "liderado"];

  return (
    <AppShell>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Olá, {user.name.split(" ")[0]}
          </h1>
          <p className="text-gray-500 mt-1">
            Avaliação 360 — {totalCompleted} de {totalTasks} concluídas
          </p>
          {totalTasks > 0 && (
            <div className="mt-3 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-2xl mx-auto">
          <StatCard
            icon={<ClipboardCheck className="w-6 h-6" />}
            label="Total de avaliações"
            value={`${totalCompleted}/${totalTasks}`}
            color="bg-primary"
          />
          <StatCard
            icon={<Star className="w-6 h-6" />}
            label="Pendentes"
            value={totalPending}
            color="bg-secondary"
          />
        </div>

        {/* Progress by type */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8 max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Progresso por tipo
          </h2>
          <div className="space-y-4">
            {typeOrder.map((type) => {
              const { total, completed } = tasksByType[type];
              if (total === 0) return null;
              const pct = (completed / total) * 100;

              return (
                <div key={type} className="flex items-center gap-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full w-40 text-center ${evaluationTypeColors[type]}`}>
                    {evaluationTypeLabels[type]}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct === 100 ? "bg-accent" : pct > 0 ? "bg-secondary" : "bg-gray-300"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600 w-16 text-right">
                    {completed}/{total}
                  </span>
                  {pct === 100 ? (
                    <UserCheck className="w-4 h-4 text-accent" />
                  ) : (
                    <div className="w-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="max-w-2xl mx-auto">
          <a
            href="/avaliacao"
            className="block w-full group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Minhas avaliações
                  </h3>
                </div>
                <p className="text-gray-500 text-sm">
                  {totalPending > 0
                    ? `${totalPending} avaliação(ões) pendente(s)`
                    : "Todas as avaliações concluídas!"}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition" />
            </div>
          </a>

        </div>
      </div>
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white`}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
