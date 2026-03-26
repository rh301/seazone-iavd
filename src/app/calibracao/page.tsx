"use client";

import { useEffect, useState } from "react";
import { Evaluation, EvaluationType, evaluationTypeLabels } from "@/lib/types";
import { getQuestions } from "@/lib/store";
import { fetchEvaluations, upsertEvaluation, fetchNotesReleased, updateNotesReleased, fetchManagerOverrides, saveManagerOverrides, regenerateAndSavePeers } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { canCalibrate, canReleaseNotes } from "@/lib/permissions";
import { findUser, getAllUsers, setManagerOverrides, getManagerOverrides } from "@/lib/org-tree";
import { scoreToGrade, toGrade, avgToGrade } from "@/lib/utils";
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
  ChevronRight,
  Save,
  MessageSquare,
  Edit3,
  UserCog,
  RotateCcw,
} from "lucide-react";
import AppShell from "@/components/app-shell";

export default function CalibracaoPage() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [nameFilter, setNameFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [notesReleased, setNotesReleasedState] = useState(false);
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [calibrationEdits, setCalibrationEdits] = useState<
    Record<string, Record<string, { score: number; comment: string }>>
  >({});
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"lista" | "hierarquia">("lista");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [editingManager, setEditingManager] = useState<string | null>(null);
  const [mgrOverrides, setMgrOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      const evals = await fetchEvaluations();
      setEvaluations(evals);
      const rel = await fetchNotesReleased();
      setNotesReleasedState(rel);
      const overrides = await fetchManagerOverrides();
      setMgrOverrides(overrides);
      setManagerOverrides(overrides);
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

  const departments = [...new Set(allPeople.map((p) => p.department))].sort();

  // Filter by name + department
  const filteredEmployees = allPeople.filter((emp) => {
    if (deptFilter && emp.department !== deptFilter) return false;
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

  async function handleChangeManagerHier(employeeId: string, newManagerId: string) {
    const updated = { ...mgrOverrides, [employeeId]: newManagerId };
    await saveManagerOverrides(updated);
    setMgrOverrides(updated);
    setManagerOverrides(updated);
    setEditingManager(null);
    // Regenerate peers since hierarchy changed
    await regenerateAndSavePeers();
  }

  async function handleRestoreManagerHier(employeeId: string) {
    const updated = { ...mgrOverrides };
    delete updated[employeeId];
    await saveManagerOverrides(updated);
    setMgrOverrides(updated);
    setManagerOverrides(updated);
    setEditingManager(null);
    await regenerateAndSavePeers();
  }

  // Priority order for display (all 4 types for full 360 view)
  const typeOrder: EvaluationType[] = ["gestor", "auto", "par", "liderado"];

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

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("lista")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === "lista"
                ? "bg-primary text-white"
                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setActiveTab("hierarquia")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === "hierarquia"
                ? "bg-primary text-white"
                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Hierarquia
          </button>
        </div>

        {activeTab === "lista" && (<>
        {/* Search + Department filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Buscar por nome, setor ou cargo..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-sm px-3 py-2.5 border border-gray-200 rounded-xl bg-white"
          >
            <option value="">Todos os departamentos</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
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
              const lideradoEvals = completedEvals.filter((e) => e.evaluationType === "liderado");
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
                          <p className={`text-lg font-bold score-${Math.round(gestorAvg)} w-8 h-8 rounded-lg flex items-center justify-center mx-auto`}>{avgToGrade(gestorAvg)}</p>
                        </div>
                      )}
                      {autoEval && getAvgForEval(autoEval) !== null && (
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Auto</p>
                          <p className={`text-lg font-bold score-${Math.round(getAvgForEval(autoEval)!)} w-8 h-8 rounded-lg flex items-center justify-center mx-auto`}>{avgToGrade(getAvgForEval(autoEval))}</p>
                        </div>
                      )}
                      {parEvals.length > 0 && (
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Pares</p>
                          <p className="text-lg font-bold text-gray-700">
                            {(() => {
                              const scores = parEvals.flatMap(e => e.answers.map(a => a.score).filter((s): s is number => s !== null));
                              return scores.length > 0 ? avgToGrade(scores.reduce((a,b) => a+b, 0) / scores.length) : "—";
                            })()}
                          </p>
                        </div>
                      )}
                      {lideradoEvals.length > 0 && (
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Liderado</p>
                          <p className="text-lg font-bold text-gray-700">
                            {(() => {
                              const scores = lideradoEvals.flatMap(e => e.answers.map(a => a.score).filter((s): s is number => s !== null));
                              return scores.length > 0 ? avgToGrade(scores.reduce((a,b) => a+b, 0) / scores.length) : "—";
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
                      {/* Medals — collapsible */}
                      {personMedals.length > 0 && (
                        <details className="group">
                          <summary className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2 cursor-pointer list-none">
                            <Award className="w-4 h-4 text-secondary" />
                            Medalhas ({personMedals.length})
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 transition group-open:rotate-90" />
                          </summary>
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
                        </details>
                      )}

                      {completedEvals.length === 0 && (
                        <p className="text-sm text-gray-400 italic">Nenhuma avaliação concluída ainda.</p>
                      )}

                      {/* Side-by-side table: Competência | Gestor (editável) | Auto | Par | Liderado */}
                      {completedEvals.length > 0 && (() => {
                        const parEvalsAll = completedEvals.filter(e => e.evaluationType === "par");
                        const lideradoEvalsAll = completedEvals.filter(e => e.evaluationType === "liderado");

                        // Helper to get avg score for a question across multiple evals
                        const avgForQuestion = (evals: Evaluation[], qId: string): number | null => {
                          const scores = evals
                            .map(ev => ev.answers.find(a => a.questionId === qId)?.score)
                            .filter((s): s is number => s !== null);
                          return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
                        };

                        return (
                          <div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 pr-3 text-xs font-medium text-gray-500 w-44">Competência</th>
                                    <th className="text-center py-2 px-1 text-xs font-medium text-primary">
                                      Gestor
                                      <span className="block text-[10px] font-normal text-primary/60">editável</span>
                                    </th>
                                    {autoEval && (
                                      <th className="text-center py-2 px-1 text-xs font-medium text-gray-500">Auto</th>
                                    )}
                                    {parEvalsAll.length > 0 && (
                                      <th className="text-center py-2 px-1 text-xs font-medium text-gray-500">
                                        Par{parEvalsAll.length > 1 ? `es (${parEvalsAll.length})` : ""}
                                      </th>
                                    )}
                                    {lideradoEvalsAll.length > 0 && (
                                      <th className="text-center py-2 px-1 text-xs font-medium text-gray-500">
                                        Lid.{lideradoEvalsAll.length > 1 ? ` (${lideradoEvalsAll.length})` : ""}
                                      </th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {questions.map((q) => {
                                    const gestorAnswer = gestorEval?.answers.find(a => a.questionId === q.id);
                                    const gestorScore = gestorAnswer?.score ?? null;
                                    const calibrated = gestorEval ? calibrationEdits[gestorEval.id]?.[q.id] : undefined;
                                    const currentGestorScore = calibrated?.score ?? gestorScore;

                                    const autoAnswer = autoEval?.answers.find(a => a.questionId === q.id);
                                    const autoScore = autoAnswer?.score ?? null;
                                    const parAvg = avgForQuestion(parEvalsAll, q.id);
                                    const lidAvg = avgForQuestion(lideradoEvalsAll, q.id);

                                    const qKey = `${empId}-${q.id}`;
                                    const isQExpanded = expandedQuestion === qKey;

                                    // Collect justifications
                                    const justifications: { label: string; text: string }[] = [];
                                    if (gestorAnswer?.justification) justifications.push({ label: "Gestor", text: gestorAnswer.justification });
                                    if (autoAnswer?.justification) justifications.push({ label: "Auto", text: autoAnswer.justification });
                                    for (const pe of parEvalsAll) {
                                      const pa = pe.answers.find(a => a.questionId === q.id);
                                      if (pa?.justification) justifications.push({ label: "Par", text: pa.justification });
                                    }
                                    for (const le of lideradoEvalsAll) {
                                      const la = le.answers.find(a => a.questionId === q.id);
                                      if (la?.justification) justifications.push({ label: "Liderado", text: la.justification });
                                    }
                                    const hasJustifications = justifications.some(j => j.text.trim().length > 0);

                                    return (
                                      <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50/50 group">
                                        <td className="py-2 pr-3 text-xs text-gray-600" title={q.title}>
                                          <div className="flex items-center gap-1">
                                            {hasJustifications && (
                                              <button
                                                onClick={() => setExpandedQuestion(isQExpanded ? null : qKey)}
                                                className="text-gray-400 hover:text-primary transition shrink-0"
                                              >
                                                {isQExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                              </button>
                                            )}
                                            <span className="truncate">{q.title}</span>
                                          </div>
                                          {isQExpanded && (
                                            <div className="mt-2 space-y-2 pl-4">
                                              {justifications.filter(j => j.text.trim()).map((j, idx) => (
                                                <div key={idx} className="bg-gray-50 rounded-lg p-2.5">
                                                  <span className="text-[10px] font-semibold text-gray-500 uppercase">{j.label}</span>
                                                  <p className="text-xs text-gray-600 mt-0.5 whitespace-pre-line">{j.text}</p>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </td>
                                        {/* Gestor — editable */}
                                        <td className="py-1.5 px-1">
                                          {gestorScore !== null ? (
                                            <div className="flex gap-0.5 justify-center">
                                              {[1, 2, 3, 4, 5].map((s) => (
                                                <button
                                                  key={s}
                                                  onClick={() => gestorEval && handleCalibrationChange(gestorEval.id, q.id, s)}
                                                  className={`w-6 h-6 rounded text-[10px] font-bold transition ${
                                                    currentGestorScore === s
                                                      ? `score-${s}`
                                                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                                  }`}
                                                >
                                                  {scoreToGrade[s]}
                                                </button>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-xs text-gray-300 flex justify-center">—</span>
                                          )}
                                        </td>
                                        {/* Auto — read only */}
                                        {autoEval && (
                                          <td className="py-2 px-1 text-center">
                                            {autoScore !== null ? (
                                              <span className={`inline-flex w-6 h-6 rounded items-center justify-center text-[10px] font-bold score-${autoScore}`}>
                                                {toGrade(autoScore)}
                                              </span>
                                            ) : (
                                              <span className="text-xs text-gray-300">—</span>
                                            )}
                                          </td>
                                        )}
                                        {/* Par — read only (avg) */}
                                        {parEvalsAll.length > 0 && (
                                          <td className="py-2 px-1 text-center">
                                            {parAvg !== null ? (
                                              <span className={`inline-flex w-6 h-6 rounded items-center justify-center text-[10px] font-bold score-${Math.round(parAvg)}`}>
                                                {toGrade(Math.round(parAvg))}
                                              </span>
                                            ) : (
                                              <span className="text-xs text-gray-300">—</span>
                                            )}
                                          </td>
                                        )}
                                        {/* Liderado — read only (avg) */}
                                        {lideradoEvalsAll.length > 0 && (
                                          <td className="py-2 px-1 text-center">
                                            {lidAvg !== null ? (
                                              <span className={`inline-flex w-6 h-6 rounded items-center justify-center text-[10px] font-bold score-${Math.round(lidAvg)}`}>
                                                {toGrade(Math.round(lidAvg))}
                                              </span>
                                            ) : (
                                              <span className="text-xs text-gray-300">—</span>
                                            )}
                                          </td>
                                        )}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* Save button */}
                            {gestorEval && calibrationEdits[gestorEval.id] && Object.keys(calibrationEdits[gestorEval.id]).length > 0 && (
                              <button
                                onClick={() => handleSaveCalibration(gestorEval)}
                                className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark transition"
                              >
                                <Save className="w-3.5 h-3.5" />
                                Salvar calibração
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </>)}

        {activeTab === "hierarquia" && (() => {
          // Build tree: group users by managerId
          const childrenMap = new Map<string, typeof allPeople>();
          const roots: typeof allPeople = [];
          for (const p of allPeople) {
            if (!p.managerId) {
              roots.push(p);
            } else {
              const list = childrenMap.get(p.managerId) || [];
              list.push(p);
              childrenMap.set(p.managerId, list);
            }
          }

          // Initialize expanded nodes: top 2 levels expanded on first render
          if (expandedNodes.size === 0 && roots.length > 0) {
            const initial = new Set<string>();
            for (const root of roots) {
              initial.add(root.id);
              const children = childrenMap.get(root.id) || [];
              for (const child of children) {
                initial.add(child.id);
              }
            }
            // Use setTimeout to avoid setState during render
            setTimeout(() => setExpandedNodes(initial), 0);
          }

          function toggleNode(id: string) {
            setExpandedNodes((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            });
          }

          function renderNode(person: typeof allPeople[0], level: number) {
            const children = childrenMap.get(person.id) || [];
            const hasChildren = children.length > 0;
            const isOpen = expandedNodes.has(person.id);
            const isEditing = editingManager === person.id;
            const hasOverride = !!mgrOverrides[person.id];

            // Get gestor evaluation grade for this person
            const evals = byEmployee.get(person.id) || [];
            const gestorEval = evals.find(
              (e) => e.evaluationType === "gestor" && (e.status === "concluida" || e.status === "calibrada")
            );
            let gestorAvg: number | null = null;
            if (gestorEval) {
              const scores = gestorEval.answers.map((a) => a.score).filter((s): s is number => s !== null);
              gestorAvg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
            }

            return (
              <div key={person.id}>
                <div
                  className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-lg transition group"
                  style={{ paddingLeft: `${level * 24 + 12}px` }}
                >
                  {/* Expand/collapse icon */}
                  <button
                    className="w-4 h-4 flex items-center justify-center shrink-0"
                    onClick={() => hasChildren && toggleNode(person.id)}
                  >
                    {hasChildren ? (
                      isOpen ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )
                    ) : (
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    )}
                  </button>

                  {/* Photo / Initials */}
                  {person.photoUrl ? (
                    <img src={person.photoUrl} alt={person.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs shrink-0">
                      {person.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                  )}

                  {/* Info */}
                  <div className="min-w-0 flex-1" onClick={() => hasChildren && toggleNode(person.id)}>
                    <span className="text-sm font-medium text-gray-900">{person.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{person.cargo} · {person.sector}</span>
                    {hasOverride && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 ml-2">override</span>
                    )}
                  </div>

                  {/* Grade badge */}
                  {gestorAvg !== null && (
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold score-${Math.round(gestorAvg)} shrink-0`}>
                      {toGrade(Math.round(gestorAvg))}
                    </span>
                  )}

                  {/* Subordinate count */}
                  {hasChildren && (
                    <span className="text-[10px] text-gray-400 shrink-0">{children.length}</span>
                  )}

                  {/* Edit button — visible on hover */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingManager(isEditing ? null : person.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-primary transition shrink-0"
                    title="Editar gestor"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Edit manager inline */}
                {isEditing && (
                  <div
                    className="py-2 px-3 bg-primary/5 border-l-2 border-primary rounded-r-lg mb-1"
                    style={{ marginLeft: `${level * 24 + 40}px` }}
                  >
                    <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <UserCog className="w-3 h-3" />
                      Trocar gestor de <span className="font-semibold">{person.name.split(" ")[0]}</span>:
                    </p>
                    <select
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 mb-2"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) handleChangeManagerHier(person.id, e.target.value);
                      }}
                    >
                      <option value="">Selecionar novo gestor...</option>
                      {allPeople
                        .filter((p) => p.id !== person.id)
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((p) => (
                          <option key={p.id} value={p.id}>{p.name} — {p.cargo} ({p.sector})</option>
                        ))}
                    </select>
                    <div className="flex gap-2">
                      {hasOverride && (
                        <button
                          onClick={() => handleRestoreManagerHier(person.id)}
                          className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restaurar original
                        </button>
                      )}
                      <button
                        onClick={() => setEditingManager(null)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Children */}
                {isOpen && children
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((child) => renderNode(child, level + 1))}
              </div>
            );
          }

          return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              {roots.sort((a, b) => a.name.localeCompare(b.name)).map((root) => renderNode(root, 0))}
            </div>
          );
        })()}
      </div>
    </AppShell>
  );
}
