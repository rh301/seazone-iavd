"use client";

import { useEffect, useState } from "react";
import { Evaluation, EvaluationType, evaluationTypeLabels } from "@/lib/types";
import { getQuestions } from "@/lib/store";
import { fetchEvaluations, upsertEvaluation, fetchNotesReleased, updateNotesReleased } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { canCalibrate, canReleaseNotes } from "@/lib/permissions";
import { findUser, getAllUsers } from "@/lib/org-tree";
import { medals } from "@/data/medals";
import {
  Scale,
  CheckCircle2,
  ShieldAlert,
  Search,
  Lock,
  Unlock,
  Award,
  ChevronDown,
  Save,
} from "lucide-react";
import AppShell from "@/components/app-shell";

export default function CalibracaoPage() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [nameFilter, setNameFilter] = useState("");
  const [notesReleased, setNotesReleasedState] = useState(false);
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [calibrationEdits, setCalibrationEdits] = useState<
    Record<string, Record<string, { score: number; comment: string }>>
  >({});

  useEffect(() => {
    async function load() {
      const evals = await fetchEvaluations();
      setEvaluations(evals);
      const rel = await fetchNotesReleased();
      setNotesReleasedState(rel);
    }
    load();
  }, []);

  if (!user) return null;

  if (!canCalibrate(user)) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <ShieldAlert className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900">Sem permissão</h2>
          <p className="text-gray-500 mt-1">Apenas RH e C-Levels podem acessar a calibração.</p>
        </div>
      </AppShell>
    );
  }

  const questions = getQuestions();

  // All evaluations grouped by employee
  const byEmployee = new Map<string, Evaluation[]>();
  for (const e of evaluations) {
    const list = byEmployee.get(e.employeeId) || [];
    list.push(e);
    byEmployee.set(e.employeeId, list);
  }

  // List ALL people, not just those with evaluations
  const allPeople = getAllUsers();

  // Filter by name
  const filteredEmployees = allPeople.filter((emp) => {
    if (emp.id === user.id) return false; // don't show self
    if (!nameFilter.trim()) return true;
    const q = nameFilter.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.sector.toLowerCase().includes(q) ||
      emp.cargo.toLowerCase().includes(q)
    );
  });

  function getAvgForEval(ev: Evaluation): number | null {
    const scores = ev.answers.map((a) => a.score).filter((s): s is number => s !== null);
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  }

  function getEvalByType(evals: Evaluation[], type: EvaluationType): Evaluation | undefined {
    return evals.find((e) => e.evaluationType === type);
  }

  async function handleToggleRelease() {
    const newState = !notesReleased;
    const msg = newState
      ? "Liberar as notas para todos os colaboradores?"
      : "Bloquear as notas?";
    if (!confirm(msg)) return;
    await updateNotesReleased(newState);
    setNotesReleasedState(newState);
  }

  function handleCalibrationChange(evalId: string, questionId: string, score: number) {
    setCalibrationEdits((prev) => ({
      ...prev,
      [evalId]: {
        ...(prev[evalId] || {}),
        [questionId]: { score, comment: prev[evalId]?.[questionId]?.comment || "" },
      },
    }));
  }

  async function handleSaveCalibration(ev: Evaluation) {
    const edits = calibrationEdits[ev.id];
    if (!edits) return;

    const entries: Record<string, { originalScore: number; calibratedScore: number; comment: string; calibratedBy: string; calibratedAt: string }> = {};
    for (const [qId, edit] of Object.entries(edits)) {
      const original = ev.answers.find((a) => a.questionId === qId)?.score || 0;
      entries[qId] = {
        originalScore: original,
        calibratedScore: edit.score,
        comment: edit.comment,
        calibratedBy: user!.id,
        calibratedAt: new Date().toISOString(),
      };
    }

    const updated: Evaluation = {
      ...ev,
      status: "calibrada",
      calibration: {
        entries,
        calibratedBy: user!.id,
        calibratedAt: new Date().toISOString(),
      },
    };
    await upsertEvaluation(updated);
    const freshEvals = await fetchEvaluations();
    setEvaluations(freshEvals);
    alert("Calibração salva!");
  }

  // Priority order for display
  const typeOrder: EvaluationType[] = ["gestor", "auto", "par"];

  return (
    <AppShell>
      <div>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Scale className="w-7 h-7 text-primary" />
              Calibração
            </h1>
            <p className="text-gray-500 mt-1">
              Revise notas do gestor, autoavaliação e pares. Ajuste se necessário.
            </p>
          </div>
          {canReleaseNotes(user) && (
            <button
              onClick={handleToggleRelease}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition shrink-0 ${
                notesReleased
                  ? "bg-accent text-white hover:bg-accent/90"
                  : "bg-secondary text-white hover:bg-secondary/90"
              }`}
            >
              {notesReleased ? (
                <><Unlock className="w-4 h-4" /> Notas liberadas</>
              ) : (
                <><Lock className="w-4 h-4" /> Liberar notas</>
              )}
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Buscar por nome, setor ou cargo..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            Nenhuma pessoa encontrada.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEmployees.map((emp) => {
              const empId = emp.id;
              const evals = byEmployee.get(empId) || [];
              const completedEvals = evals.filter(e => e.status === "concluida" || e.status === "calibrada");

              const isExpanded = expandedPerson === empId;
              const gestorEval = getEvalByType(completedEvals, "gestor");
              const autoEval = getEvalByType(completedEvals, "auto");
              const parEvals = completedEvals.filter((e) => e.evaluationType === "par");
              const gestorAvg = gestorEval ? getAvgForEval(gestorEval) : null;

              // Medals for this person (match by id or email prefix)
              const personMedals = medals.filter(
                (m) => m.employeeId === empId ||
                  m.employeeEmail.toLowerCase().startsWith(emp.name.toLowerCase().split(" ")[0])
              );

              return (
                <div key={empId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Summary row */}
                  <button
                    onClick={() => setExpandedPerson(isExpanded ? null : empId)}
                    className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      {emp.photoUrl ? (
                        <img src={emp.photoUrl} alt={emp.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                          {emp.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{emp.name}</h3>
                        <p className="text-xs text-gray-500">{emp.cargo} · {emp.sector}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Quick scores */}
                      {gestorAvg !== null && (
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Gestor</p>
                          <p className="text-lg font-bold text-primary">{gestorAvg.toFixed(1)}</p>
                        </div>
                      )}
                      {autoEval && getAvgForEval(autoEval) !== null && (
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Auto</p>
                          <p className="text-lg font-bold text-gray-700">{getAvgForEval(autoEval)!.toFixed(1)}</p>
                        </div>
                      )}
                      {parEvals.length > 0 && (
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Pares</p>
                          <p className="text-lg font-bold text-gray-700">
                            {(() => {
                              const scores = parEvals.flatMap(e => e.answers.map(a => a.score).filter((s): s is number => s !== null));
                              return scores.length > 0 ? (scores.reduce((a,b) => a+b, 0) / scores.length).toFixed(1) : "—";
                            })()}
                          </p>
                        </div>
                      )}
                      {personMedals.length > 0 && (
                        <div className="flex items-center gap-1 text-secondary">
                          <Award className="w-4 h-4" />
                          <span className="text-sm font-bold">{personMedals.length}</span>
                        </div>
                      )}
                      {completedEvals.some(e => e.status === "calibrada") && (
                        <CheckCircle2 className="w-5 h-5 text-accent" />
                      )}
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-5 space-y-6">
                      {/* Medals */}
                      {personMedals.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Award className="w-4 h-4 text-secondary" />
                            Medalhas ({personMedals.length})
                          </h4>
                          <div className="space-y-2">
                            {personMedals.map((medal, idx) => (
                              <div key={idx} className="bg-secondary/5 border border-secondary/10 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-semibold text-secondary">{medal.habilidade}</span>
                                  <span className="text-xs text-gray-400">{medal.data} · {medal.quemEnviou}</span>
                                </div>
                                <p className="text-xs text-gray-600">{medal.justificativa}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Evaluations by type (Gestor first, then Auto, then Pares) */}
                      {completedEvals.length === 0 && (
                        <p className="text-sm text-gray-400 italic">Nenhuma avaliação concluída ainda.</p>
                      )}
                      {typeOrder.map((type) => {
                        const typeEvals = completedEvals.filter((e) => e.evaluationType === type);
                        if (typeEvals.length === 0) return null;

                        return (
                          <div key={type}>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                              {evaluationTypeLabels[type]}
                              {type === "gestor" && <span className="text-xs text-primary ml-2">(nota principal)</span>}
                              {type === "par" && <span className="text-xs text-gray-400 ml-2">({typeEvals.length} avaliação(ões))</span>}
                            </h4>

                            {typeEvals.map((ev) => (
                              <div key={ev.id} className="mb-4">
                                <div className="space-y-2">
                                  {ev.answers.map((answer) => {
                                    const q = questions.find((q) => q.id === answer.questionId);
                                    if (!q || answer.score === null) return null;

                                    const calibrated = calibrationEdits[ev.id]?.[answer.questionId];
                                    const currentScore = calibrated?.score ?? answer.score;

                                    return (
                                      <div key={answer.questionId} className="flex items-center gap-3 py-1.5">
                                        <span className="text-xs text-gray-600 w-40 truncate" title={q.title}>{q.title}</span>
                                        <div className="flex gap-1">
                                          {[1, 2, 3, 4, 5].map((s) => (
                                            <button
                                              key={s}
                                              onClick={() => handleCalibrationChange(ev.id, answer.questionId, s)}
                                              className={`w-7 h-7 rounded text-xs font-bold transition ${
                                                currentScore === s
                                                  ? `score-${s}`
                                                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                              }`}
                                            >
                                              {s}
                                            </button>
                                          ))}
                                        </div>
                                        {answer.score !== currentScore && (
                                          <span className="text-xs text-secondary">
                                            era {answer.score}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Save button for this eval */}
                                {calibrationEdits[ev.id] && Object.keys(calibrationEdits[ev.id]).length > 0 && (
                                  <button
                                    onClick={() => handleSaveCalibration(ev)}
                                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark transition"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    Salvar calibração — {evaluationTypeLabels[type]}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
