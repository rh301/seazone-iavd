"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getRequiredEvaluations, type EvaluationTask } from "@/lib/permissions";
import { getQuestions, createEmptyAnswers } from "@/lib/store";
import { fetchEvaluationsByEvaluator, fetchPeerAssignments, upsertEvaluation } from "@/lib/db";
import { findUser } from "@/lib/org-tree";
import {
  Search,
  ArrowRight,
  CheckCircle2,
  Clock,
  User as UserIcon,
  Users,
  UserCheck,
  Star,
  Award,
  X,
} from "lucide-react";
import { medals } from "@/data/medals";
import AppShell from "@/components/app-shell";
import {
  Evaluation,
  EvaluationType,
  evaluationTypeLabels,
  evaluationTypeColors,
} from "@/lib/types";

const typeIcons: Record<EvaluationType, typeof UserIcon> = {
  auto: Star,
  gestor: UserCheck,
  par: Users,
  liderado: UserIcon,
};

const typeDescriptions: Record<EvaluationType, string> = {
  auto: "Avalie seu próprio desempenho com honestidade",
  gestor: "Avalie seus liderados diretos",
  par: "Avalie colegas de áreas próximas",
  liderado: "Avalie seu gestor direto",
};

export default function AvaliacaoPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [tasks, setTasks] = useState<EvaluationTask[]>([]);
  const [showMedalsFor, setShowMedalsFor] = useState<string | null>(null);
  const router = useRouter();

  function getMedalsForPerson(evaluateeId: string) {
    const userData = findUser(evaluateeId);
    if (!userData?.email) return [];
    const email = userData.email.toLowerCase();
    return medals.filter((m) => m.employeeEmail.toLowerCase() === email);
  }

  useEffect(() => {
    if (!user) return;
    async function load() {
      const evals = await fetchEvaluationsByEvaluator(user!.id);
      setEvaluations(evals);
      const assignments = await fetchPeerAssignments();
      setTasks(getRequiredEvaluations(user!.id, assignments));
    }
    load();
  }, [user]);

  if (!user) return null;

  // Group tasks by evaluation type
  const grouped = tasks.reduce(
    (acc, task) => {
      (acc[task.evaluationType] = acc[task.evaluationType] || []).push(task);
      return acc;
    },
    {} as Record<EvaluationType, EvaluationTask[]>
  );

  const typeOrder: EvaluationType[] = ["auto", "gestor", "par", "liderado"];

  // Filter by search
  const matchesSearch = (task: EvaluationTask) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      task.evaluateeName.toLowerCase().includes(q) ||
      task.evaluateeSector.toLowerCase().includes(q) ||
      task.evaluateeCargo.toLowerCase().includes(q)
    );
  };

  function getEvalStatus(task: EvaluationTask) {
    return evaluations.find(
      (e) =>
        e.employeeId === task.evaluateeId &&
        e.evaluatorId === user!.id &&
        e.evaluationType === task.evaluationType
    );
  }

  async function startOrContinue(task: EvaluationTask) {
    const existing = getEvalStatus(task);
    if (existing && (existing.status === "em_andamento" || existing.status === "concluida" || existing.status === "calibrada")) {
      // Open existing evaluation (view-only if concluida)
      router.push(`/avaliacao/${existing.id}`);
      return;
    }
    const questions = getQuestions();
    const evalId = `eval_${Date.now()}`;
    await upsertEvaluation({
      id: evalId,
      employeeId: task.evaluateeId,
      evaluatorId: user!.id,
      evaluationType: task.evaluationType,
      date: new Date().toISOString().split("T")[0],
      status: "em_andamento",
      answers: createEmptyAnswers(questions),
    });
    const freshEvals = await fetchEvaluationsByEvaluator(user!.id);
    setEvaluations(freshEvals);
    router.push(`/avaliacao/${evalId}`);
  }

  // Progress stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (t) => {
      const s = getEvalStatus(t)?.status;
      return s === "concluida" || s === "calibrada";
    }
  ).length;

  return (
    <AppShell>
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Avaliação 360
          </h1>
          <p className="text-gray-500 mt-1">
            {completedTasks} de {totalTasks} avaliações concluídas
          </p>
          {totalTasks > 0 && (
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{
                  width: `${(completedTasks / totalTasks) * 100}%`,
                }}
              />
            </div>
          )}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, setor ou cargo..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="space-y-8">
          {typeOrder.map((type) => {
            const typeTasks = (grouped[type] || []).filter(matchesSearch);
            if (typeTasks.length === 0) return null;

            const Icon = typeIcons[type];
            const completedInType = typeTasks.filter(
              (t) => {
                const s = getEvalStatus(t)?.status;
                return s === "concluida" || s === "calibrada";
              }
            ).length;

            return (
              <div key={type}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${evaluationTypeColors[type]}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {evaluationTypeLabels[type]}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {typeDescriptions[type]} — {completedInType}/
                      {typeTasks.length}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {typeTasks.map((task) => {
                    const evalData = getEvalStatus(task);
                    const isDone = evalData?.status === "concluida" || evalData?.status === "calibrada";
                    const isInProgress = evalData?.status === "em_andamento";

                    return (
                      <div key={`${task.evaluationType}-${task.evaluateeId}`} className="space-y-1">
                      <button
                        onClick={() => startOrContinue(task)}
                        className="w-full group bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {task.evaluateePhotoUrl ? (
                              <img
                                src={task.evaluateePhotoUrl}
                                alt={task.evaluateeName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
                                {task.evaluateeName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-semibold text-gray-900 text-sm truncate">
                                  {task.evaluateeName}
                                </h3>
                                {(() => {
                                  const personMedals = getMedalsForPerson(task.evaluateeId);
                                  if (personMedals.length === 0) return null;
                                  return (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMedalsFor(showMedalsFor === task.evaluateeId ? null : task.evaluateeId);
                                      }}
                                      className="flex items-center gap-0.5 text-secondary hover:text-secondary/80 transition shrink-0"
                                      title={`${personMedals.length} medalha(s)`}
                                    >
                                      <Award className="w-3.5 h-3.5" />
                                      <span className="text-xs font-bold">{personMedals.length}</span>
                                    </button>
                                  );
                                })()}
                              </div>
                              <p className="text-xs text-gray-500 truncate">
                                {task.evaluateeCargo}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {task.evaluateeSector}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isDone && (
                              <span className="flex items-center gap-1 text-xs text-accent bg-accent/10 px-2 py-1 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                              </span>
                            )}
                            {isInProgress && (
                              <span className="flex items-center gap-1 text-xs text-secondary bg-secondary/10 px-2 py-1 rounded-full">
                                <Clock className="w-3 h-3" />
                              </span>
                            )}
                            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition" />
                          </div>
                        </div>
                      </button>
                      {/* Medals panel */}
                      {showMedalsFor === task.evaluateeId && (() => {
                        const personMedals = getMedalsForPerson(task.evaluateeId);
                        return (
                          <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4 -mt-1">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-secondary flex items-center gap-1.5">
                                <Award className="w-4 h-4" />
                                Medalhas de {task.evaluateeName.split(" ")[0]}
                              </h4>
                              <button onClick={() => setShowMedalsFor(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {personMedals.map((medal, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-2.5 border border-secondary/10">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-xs font-semibold text-secondary">{medal.habilidade}</span>
                                    <span className="text-[10px] text-gray-400">{medal.data}</span>
                                  </div>
                                  <p className="text-xs text-gray-600 line-clamp-2">{medal.justificativa}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">por {medal.quemEnviou}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
