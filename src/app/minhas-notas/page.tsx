"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getQuestions } from "@/lib/store";
import { fetchEvaluations, fetchNotesReleased } from "@/lib/db";
import { findUser } from "@/lib/org-tree";
import { historyRecords, currentCycleRecords, allPeriods, cicloAnterior } from "@/data/history";
import {
  Evaluation,
  Question,
  EvaluationType,
  evaluationTypeLabels,
  evaluationTypeColors,
} from "@/lib/types";
import AppShell from "@/components/app-shell";
import {
  Lock,
  Eye,
  Star,
  UserCheck,
  Users,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const typeIcons: Record<EvaluationType, typeof UserIcon> = {
  auto: Star,
  gestor: UserCheck,
  par: Users,
  liderado: UserIcon,
};

export default function MinhasNotasPage() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [released, setReleased] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const allEvals = await fetchEvaluations();
      // Evaluations where I am the one being evaluated
      const myEvals = allEvals.filter(
        (e) => e.employeeId === user!.id && e.status !== "em_andamento"
      );
      setEvaluations(myEvals);
      setQuestions(getQuestions());
      const rel = await fetchNotesReleased();
      setReleased(rel);
    }
    load();
  }, [user]);

  if (!user) return null;

  // Group by evaluation type
  const typeOrder: EvaluationType[] = ["auto", "gestor", "par", "liderado"];
  const grouped = evaluations.reduce(
    (acc, ev) => {
      const type = ev.evaluationType || "gestor";
      (acc[type] = acc[type] || []).push(ev);
      return acc;
    },
    {} as Record<EvaluationType, Evaluation[]>
  );

  function getScore(ev: Evaluation): number | null {
    const scores = ev.answers
      .map((a) => {
        // Use calibrated score if available
        if (ev.calibration?.entries[a.questionId]) {
          return ev.calibration.entries[a.questionId].calibratedScore;
        }
        return a.score;
      })
      .filter((s): s is number => s !== null);

    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  function getEvaluatorLabel(ev: Evaluation): string {
    const type = ev.evaluationType || "gestor";
    // Self-evaluation: always show own name
    if (type === "auto") return user!.name;
    // Peer and subordinate evaluations: anonymous
    if (type === "par" || type === "liderado") return "Anônimo";
    // Manager evaluation: show evaluator name
    const evaluator = findUser(ev.evaluatorId);
    return evaluator?.name || "Desconhecido";
  }

  const totalEvals = evaluations.length;
  const hasData = totalEvals > 0;

  // History from all cycles
  const myHistory = historyRecords.filter(
    (r) => r.employeeId === user.id
  );
  const myCurrentCycle = currentCycleRecords.filter(
    (r) => r.employeeId === user.id
  );

  return (
    <AppShell>
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Minhas Notas</h1>
          <p className="text-gray-500 mt-1">
            Veja as avaliações que fizeram sobre você
          </p>
        </div>

        {!released && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900">
                Notas ainda não liberadas
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                As notas do ciclo atual serão liberadas pelo RH após a
                calibragem. Você será notificado quando estiverem disponíveis.
              </p>
            </div>
          </div>
        )}

        {!hasData && (
          <div className="text-center py-16">
            <Eye className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900">
              Nenhuma avaliação encontrada
            </h2>
            <p className="text-gray-500 mt-1">
              Quando alguém concluir uma avaliação sobre você, ela aparecerá
              aqui.
            </p>
          </div>
        )}

        {hasData && (
          <div className="space-y-8">
            {typeOrder.map((type) => {
              const typeEvals = grouped[type];
              if (!typeEvals || typeEvals.length === 0) return null;

              const Icon = typeIcons[type];

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
                        {typeEvals.length} avaliação(ões)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {typeEvals.map((ev) => {
                      const avg = getScore(ev);
                      const isExpanded = expandedId === ev.id;
                      const evaluatorLabel = getEvaluatorLabel(ev);

                      return (
                        <div
                          key={ev.id}
                          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                        >
                          <button
                            onClick={() =>
                              setExpandedId(isExpanded ? null : ev.id)
                            }
                            disabled={!released}
                            className="w-full p-4 flex items-center justify-between text-left disabled:cursor-default"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-sm">
                                <p className="font-medium text-gray-900">
                                  {evaluatorLabel}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {ev.date}
                                  {ev.status === "calibrada" && (
                                    <span className="ml-2 text-accent">
                                      Calibrada
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {released && avg !== null ? (
                                <>
                                  <div
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold score-${Math.round(avg)}`}
                                  >
                                    {avg.toFixed(1)}
                                  </div>
                                  <ChevronDown
                                    className={`w-4 h-4 text-gray-400 transition ${isExpanded ? "rotate-180" : ""}`}
                                  />
                                </>
                              ) : (
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Lock className="w-4 h-4" />
                                  <span className="text-xs">Pendente</span>
                                </div>
                              )}
                            </div>
                          </button>

                          {/* Expanded detail */}
                          {released && isExpanded && (
                            <div className="border-t border-gray-100 p-4 space-y-3">
                              {ev.answers.map((answer) => {
                                const q = questions.find(
                                  (q) => q.id === answer.questionId
                                );
                                if (!q) return null;

                                const calibrated =
                                  ev.calibration?.entries[answer.questionId];
                                const finalScore =
                                  calibrated?.calibratedScore ?? answer.score;
                                const scaleLevel = q.scale.find(
                                  (s) => s.score === finalScore
                                );

                                return (
                                  <div
                                    key={answer.questionId}
                                    className="flex items-center justify-between py-2"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {q.title}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {q.category}
                                        {scaleLevel && (
                                          <span className="ml-2">
                                            — {scaleLevel.label}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                    <div className="ml-3">
                                      {finalScore !== null ? (
                                        <div
                                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold score-${finalScore}`}
                                        >
                                          {finalScore}
                                        </div>
                                      ) : (
                                        <span className="text-xs text-gray-400">
                                          —
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                              {/* AI reasoning (only for auto, since it's your own) */}
                              {type === "auto" &&
                                ev.answers.some((a) => a.aiReasoning) && (
                                  <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-xs font-semibold text-gray-500 mb-2">
                                      Feedback da IA
                                    </p>
                                    {ev.answers
                                      .filter((a) => a.aiReasoning)
                                      .map((a) => {
                                        const q = questions.find(
                                          (q) => q.id === a.questionId
                                        );
                                        return (
                                          <div
                                            key={a.questionId}
                                            className="mb-2"
                                          >
                                            <p className="text-xs font-medium text-gray-700">
                                              {q?.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-line">
                                              {a.aiReasoning?.substring(0, 300)}
                                              ...
                                            </p>
                                          </div>
                                        );
                                      })}
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {/* History from all cycles */}
        {(myHistory.length > 0 || myCurrentCycle.length > 0) && (
          <div className="mt-10">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4"
            >
              <ChevronDown
                className={`w-5 h-5 transition ${showHistory ? "rotate-180" : ""}`}
              />
              Histórico de ciclos anteriores
            </button>

            {showHistory && (
              <div className="space-y-6">
                {/* Current cycle (BD_Análises) */}
                {myCurrentCycle.length > 0 && (
                  <div className="space-y-3">
                      {myCurrentCycle.map((record, idx) => {
                        const conceitoColors: Record<string, string> = {
                          A: "bg-purple-100 text-purple-700", B: "bg-blue-100 text-blue-700",
                          C: "bg-emerald-100 text-emerald-700", D: "bg-amber-100 text-amber-700",
                          E: "bg-red-100 text-red-700",
                        };
                        return (
                          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{cicloAnterior}</p>
                                                              </div>
                              <div className="flex items-center gap-3">
                                {record.conceito && (
                                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${conceitoColors[record.conceito] || "bg-gray-100 text-gray-700"}`}>{record.conceito}</span>
                                )}
                                <div className="text-right">
                                  <p className="text-xs text-gray-400">Soma</p>
                                  <p className="text-lg font-bold text-gray-900">{record.soma}</p>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                              {Object.entries(record.scores).map(([criterion, score]) => (
                                <div key={criterion} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                  <span className="text-xs text-gray-600 truncate mr-2">{criterion}</span>
                                  <span className={`text-xs font-bold w-6 h-6 rounded flex items-center justify-center score-${score}`}>{score}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Historical cycles grouped by period */}
                {[...new Set(myHistory.map((r) => r.periodo))].sort().reverse().map((periodo) => {
                  const periodRecords = myHistory.filter((r) => r.periodo === periodo);
                  return (
                    <div key={periodo} className="space-y-3">
                        {periodRecords.map((record, idx) => {
                          const soma = record.gestorSoma || record.autoSoma;
                          const pct = soma > 0 ? (soma / 100) * 100 : 0;
                          const conceito = pct >= 80 ? "A" : pct >= 65 ? "B" : pct >= 50 ? "C" : pct >= 35 ? "D" : "E";
                          const conceitoColors: Record<string, string> = {
                            A: "bg-purple-100 text-purple-700", B: "bg-blue-100 text-blue-700",
                            C: "bg-emerald-100 text-emerald-700", D: "bg-amber-100 text-amber-700",
                            E: "bg-red-100 text-red-700",
                          };

                          return (
                          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{periodo}</p>
                                                              </div>
                              <div className="flex items-center gap-3">
                                {soma > 0 && (
                                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${conceitoColors[conceito]}`}>{conceito}</span>
                                )}
                                {record.autoSoma > 0 && (
                                  <div className="text-right">
                                    <p className="text-xs text-gray-400">Auto</p>
                                    <p className="text-lg font-bold text-gray-900">{record.autoSoma}</p>
                                  </div>
                                )}
                                {record.gestorSoma > 0 && (
                                  <div className="text-right">
                                    <p className="text-xs text-gray-400">Gestor</p>
                                    <p className="text-lg font-bold text-primary">{record.gestorSoma}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            {Object.keys(record.gestorScores).length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {Object.entries(record.gestorScores).map(([criterion, score]) => (
                                  <div key={criterion} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                    <span className="text-xs text-gray-600 truncate mr-2">{criterion}</span>
                                    <span className={`text-xs font-bold w-6 h-6 rounded flex items-center justify-center score-${score}`}>{score}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
