"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Users,
  ClipboardCheck,
  TrendingUp,
  ArrowRight,
  Brain,
  UserCheck,
  UserX,
  Eye,
} from "lucide-react";
import { getEvaluations, getQuestions } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { getEvaluatableUsers, getVisibleUsers, canManageQuestions } from "@/lib/permissions";
import { users as allUsers } from "@/data/users";
import { Evaluation } from "@/lib/types";
import AppShell from "@/components/app-shell";

export default function Dashboard() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    setEvaluations(getEvaluations());
    setTotalQuestions(getQuestions().length);
  }, []);

  if (!user) return null;

  const evaluatable = getEvaluatableUsers(user);
  const visible = getVisibleUsers(user);
  const canAdmin = canManageQuestions(user);

  // Avaliações feitas por mim
  const myEvaluations = evaluations.filter((e) => e.evaluatorId === user.id);
  const myCompleted = myEvaluations.filter((e) => e.status === "concluida");
  const myInProgress = myEvaluations.filter((e) => e.status === "em_andamento");

  // Quem eu já avaliei
  const evaluatedIds = new Set(myEvaluations.map((e) => e.employeeId));
  const pendingToEvaluate = evaluatable.filter((u) => !evaluatedIds.has(u.id));

  // Avaliações visíveis (da minha área / equipe)
  const visibleEvaluations = evaluations.filter((e) => {
    const evaluatedUser = allUsers.find((u) => u.id === e.employeeId);
    if (!evaluatedUser) return false;
    return visible.some((v) => v.id === e.employeeId) || e.evaluatorId === user.id;
  });

  const visibleCompleted = visibleEvaluations.filter((e) => e.status === "concluida");

  // Nota média das avaliações visíveis
  let totalScore = 0;
  let scoreCount = 0;
  visibleCompleted.forEach((e) => {
    e.answers.forEach((a) => {
      if (a.score) {
        totalScore += a.score;
        scoreCount++;
      }
    });
  });
  const avgScore = scoreCount > 0 ? totalScore / scoreCount : 0;

  return (
    <AppShell>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Olá, {user.name.split(" ")[0]}
          </h1>
          <p className="text-gray-500 mt-1">
            {user.role === "c_level" || user.role === "rh"
              ? "Visão geral de todas as avaliações da empresa"
              : user.role === "diretor"
              ? `Visão geral da área de ${user.department}`
              : user.role === "coordenador"
              ? "Visão geral da sua equipe"
              : "Sua área de avaliações"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {evaluatable.length > 0 && (
            <StatCard
              icon={<ClipboardCheck className="w-6 h-6" />}
              label="Minhas avaliações"
              value={`${myCompleted.length}/${evaluatable.length}`}
              color="bg-primary"
            />
          )}
          {evaluatable.length > 0 && (
            <StatCard
              icon={<UserX className="w-6 h-6" />}
              label="Pendentes"
              value={pendingToEvaluate.length}
              color="bg-secondary"
            />
          )}
          {visible.length > 0 && (
            <StatCard
              icon={<Eye className="w-6 h-6" />}
              label="Avaliações visíveis"
              value={visibleEvaluations.length}
              color="bg-accent"
            />
          )}
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Nota média"
            value={avgScore > 0 ? avgScore.toFixed(1) : "—"}
            color="bg-primary-light"
          />
        </div>

        {/* Pending evaluations alert */}
        {pendingToEvaluate.length > 0 && (
          <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-5 mb-8">
            <div className="flex items-start gap-3">
              <UserX className="w-5 h-5 text-secondary mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  Você tem {pendingToEvaluate.length} avaliação(ões) pendente(s)
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pendingToEvaluate.map((u) => (
                    <span
                      key={u.id}
                      className="text-xs bg-white px-2.5 py-1 rounded-full border border-gray-200 text-gray-700"
                    >
                      {u.name}
                    </span>
                  ))}
                </div>
                <a
                  href="/avaliacao"
                  className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-secondary hover:underline"
                >
                  Iniciar avaliações
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Team overview for directors/c-level */}
        {(user.role === "c_level" || user.role === "rh" || user.role === "diretor") && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {user.role === "c_level" || user.role === "rh"
                ? "Progresso por área"
                : `Equipe — ${user.department}`}
            </h2>
            <div className="space-y-3">
              {getEvaluatorProgress(visible, evaluations, user).map((item) => (
                <div
                  key={item.evaluatorId}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs">
                      {item.evaluatorName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.evaluatorName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.department}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          item.progress === 100
                            ? "bg-accent"
                            : item.progress > 0
                            ? "bg-secondary"
                            : "bg-gray-300"
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-20 text-right">
                      {item.completed}/{item.total} avaliados
                    </span>
                    {item.progress === 100 ? (
                      <UserCheck className="w-4 h-4 text-accent" />
                    ) : (
                      <UserX className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {evaluatable.length > 0 && (
            <a
              href="/avaliacao"
              className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <ClipboardCheck className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Avaliar equipe
                    </h3>
                  </div>
                  <p className="text-gray-500 text-sm">
                    Avalie seus liderados com assistência de IA
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition" />
              </div>
            </a>
          )}

          {canAdmin && (
            <a
              href="/admin/perguntas"
              className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-secondary" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Gerenciar Critérios
                    </h3>
                  </div>
                  <p className="text-gray-500 text-sm">
                    Configure perguntas e interpretações da diretoria
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition" />
              </div>
            </a>
          )}
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

interface EvaluatorProgress {
  evaluatorId: string;
  evaluatorName: string;
  department: string;
  total: number;
  completed: number;
  progress: number;
}

function getEvaluatorProgress(
  visibleUsers: { id: string }[],
  evaluations: Evaluation[],
  currentUser: { role: string }
): EvaluatorProgress[] {
  // Find all users who have direct reports among visible users
  const evaluators = new Map<string, { name: string; department: string; reports: string[] }>();

  for (const vu of visibleUsers) {
    const u = allUsers.find((a) => a.id === vu.id);
    if (!u || !u.managerId) continue;
    const manager = allUsers.find((a) => a.id === u.managerId);
    if (!manager) continue;

    if (!evaluators.has(manager.id)) {
      evaluators.set(manager.id, {
        name: manager.name,
        department: manager.department,
        reports: [],
      });
    }
    evaluators.get(manager.id)!.reports.push(u.id);
  }

  return Array.from(evaluators.entries()).map(([id, data]) => {
    const completed = data.reports.filter((reportId) =>
      evaluations.some(
        (e) =>
          e.employeeId === reportId &&
          e.evaluatorId === id &&
          e.status === "concluida"
      )
    ).length;

    return {
      evaluatorId: id,
      evaluatorName: data.name,
      department: data.department,
      total: data.reports.length,
      completed,
      progress: data.reports.length > 0 ? (completed / data.reports.length) * 100 : 0,
    };
  });
}
