"use client";

import { useEffect, useState } from "react";
import { Evaluation, evaluationTypeLabels, EvaluationType } from "@/lib/types";
import { getQuestions } from "@/lib/store";
import { fetchEvaluationsByType } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { canViewEvaluation } from "@/lib/permissions";
import { findUser, getAllSubordinates } from "@/lib/org-tree";
import { roleLabels } from "@/lib/auth-types";
import {
  Clock,
  CheckCircle2,
  ChevronRight,
  FileText,
  AlertCircle,
  Eye,
  Filter,
  Search,
  Download,
  BarChart3,
  Users,
  TrendingUp,
  Star,
} from "lucide-react";
import AppShell from "@/components/app-shell";

type StatusFilter = "todas" | "em_andamento" | "concluida" | "calibrada";

export default function Historico() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas");
  const [departmentFilter, setDepartmentFilter] = useState<string>("todas");
  const [nameSearch, setNameSearch] = useState("");
  const [showDashboard, setShowDashboard] = useState(true);

  useEffect(() => {
    async function load() {
      const evals = await fetchEvaluationsByType("gestor");
      setEvaluations(evals);
    }
    load();
  }, []);

  if (!user) return null;

  const questions = getQuestions();

  // All subordinates (direct + indirect)
  const mySubordinates = getAllSubordinates(user.id);

  // Group gestor evaluations by employee (only gestor notes visible to leaders)
  const evalsByEmployee = new Map<string, Evaluation[]>();
  for (const e of evaluations) {
    if (e.evaluationType !== "gestor") continue;
    const list = evalsByEmployee.get(e.employeeId) || [];
    list.push(e);
    evalsByEmployee.set(e.employeeId, list);
  }

  // Visible people: self + all subordinates
  const visiblePeople = [user, ...mySubordinates.map(s => findUser(s.id)).filter(Boolean)] as NonNullable<ReturnType<typeof findUser>>[];

  // Visible evaluations: only gestor evaluations (the official score)
  const visibleEvaluations = evaluations.filter((e) =>
    e.evaluationType === "gestor" && (
      e.evaluatorId === user.id ||
      mySubordinates.some(s => s.id === e.employeeId) ||
      canViewEvaluation(user, e.employeeId, e.evaluatorId)
    )
  );

  const departments = [
    ...new Set(visiblePeople.map((p) => p.department).filter(Boolean)),
  ];

  // Filter people
  const filteredPeople = visiblePeople.filter((emp) => {
    if (departmentFilter !== "todas" && emp.department !== departmentFilter) return false;
    if (nameSearch.trim()) {
      const q = nameSearch.toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.sector.toLowerCase().includes(q) ||
        emp.cargo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sort: people with evaluations first, then alphabetical
  const sortedPeople = [...filteredPeople].sort((a, b) => {
    const aEvals = evalsByEmployee.get(a.id)?.length || 0;
    const bEvals = evalsByEmployee.get(b.id)?.length || 0;
    if (aEvals > 0 && bEvals === 0) return -1;
    if (aEvals === 0 && bEvals > 0) return 1;
    return a.name.localeCompare(b.name);
  });

  const getAvgScore = (eval_: Evaluation) => {
    const scores = eval_.answers
      .map((a) => a.score)
      .filter((s): s is number => s !== null);
    return scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null;
  };

  // ── Dashboard stats ──
  const completed = visibleEvaluations.filter(
    (e) => e.status === "concluida" || e.status === "calibrada"
  );
  const inProgress = visibleEvaluations.filter(
    (e) => e.status === "em_andamento"
  );

  const allScores = completed.flatMap((e) =>
    e.answers.map((a) => a.score).filter((s): s is number => s !== null)
  );
  const avgGeral =
    allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 0;

  const scoreDist = [1, 2, 3, 4, 5].map(
    (s) => allScores.filter((sc) => sc === s).length
  );
  const maxDist = Math.max(...scoreDist, 1);

  // By type
  const byType: Record<string, number> = {};
  for (const e of completed) {
    const t = e.evaluationType || "gestor";
    byType[t] = (byType[t] || 0) + 1;
  }

  // Avg by question
  const avgByQuestion = questions.map((q) => {
    const scores = completed.flatMap((e) => {
      const a = e.answers.find((a) => a.questionId === q.id);
      return a?.score ? [a.score] : [];
    });
    const avg =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { question: q, avg, count: scores.length };
  });

  // ── Export CSV ──
  function handleExportCSV() {
    const header = [
      "Avaliado",
      "Cargo",
      "Setor",
      "Avaliador",
      "Tipo",
      "Status",
      "Data",
      ...questions.map((q) => q.title),
      "Média",
    ];

    const rows = sortedPeople.flatMap((emp) => {
      const empEvals = (evalsByEmployee.get(emp.id) || []).filter(e => e.status !== "em_andamento");
      if (empEvals.length === 0) {
        return [[emp.name, emp.cargo, emp.sector, "", "", "Sem avaliação", "", ...questions.map(() => ""), ""]];
      }
      return empEvals.map((e) => {
      const evaluator = findUser(e.evaluatorId);
      const scores = questions.map((q) => {
        const a = e.answers.find((a) => a.questionId === q.id);
        if (e.calibration?.entries[q.id]) {
          return e.calibration.entries[q.id].calibratedScore.toString();
        }
        return a?.score?.toString() || "";
      });
      const avg = getAvgScore(e);

      return [
        emp.name,
        emp.cargo,
        emp.sector,
        evaluator?.name || "",
        evaluationTypeLabels[e.evaluationType as EvaluationType] || e.evaluationType || "",
        e.status,
        e.date,
        ...scores,
        avg !== null ? avg.toFixed(1) : "",
      ];
      });
    });

    const csv =
      header.join(",") +
      "\n" +
      rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `avd_historico_gestor_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDashboard(!showDashboard)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                showDashboard
                  ? "bg-primary text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Dashboard
            </button>
            <button
              onClick={handleExportCSV}
              disabled={sortedPeople.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent/90 transition disabled:opacity-30"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Eye className="w-3.5 h-3.5" />
              {sortedPeople.length} pessoas
            </div>
          </div>
        </div>

        {/* Dashboard */}
        {showDashboard && visibleEvaluations.length > 0 && (
          <div className="mb-8 space-y-4">
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{completed.length}</p>
                    <p className="text-xs text-gray-500">Concluídas</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{inProgress.length}</p>
                    <p className="text-xs text-gray-500">Em andamento</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{avgGeral.toFixed(1)}</p>
                    <p className="text-xs text-gray-500">Nota média</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">
                      {new Set(completed.map((e) => e.employeeId)).size}
                    </p>
                    <p className="text-xs text-gray-500">Pessoas avaliadas</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Score distribution */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-secondary" />
                  Distribuição de notas
                </h3>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <div key={score} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold score-${score}`}>
                        {score}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                        <div
                          className={`h-full rounded-full score-${score}-bg`}
                          style={{
                            width: `${(scoreDist[score - 1] / maxDist) * 100}%`,
                            backgroundColor:
                              score === 1 ? "#ef4444" :
                              score === 2 ? "#f97316" :
                              score === 3 ? "#eab308" :
                              score === 4 ? "#22c55e" : "#0f4c81",
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">
                        {scoreDist[score - 1]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avg by criterion */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Média por critério
                </h3>
                <div className="space-y-2">
                  {avgByQuestion
                    .filter((a) => a.count > 0)
                    .sort((a, b) => a.avg - b.avg)
                    .map(({ question: q, avg, count }) => (
                      <div key={q.id} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 w-32 truncate" title={q.title}>
                          {q.title}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                          <div
                            className="h-full rounded-full bg-primary/70"
                            style={{ width: `${(avg / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700 w-8 text-right">
                          {avg.toFixed(1)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder="Buscar por nome, cargo ou setor..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="text-sm px-3 py-2 border border-gray-200 rounded-lg bg-white"
            >
              <option value="todas">Todos os status</option>
              <option value="em_andamento">Em andamento</option>
              <option value="concluida">Concluída</option>
            </select>
          </div>
          {departments.length > 1 && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="text-sm px-3 py-2 border border-gray-200 rounded-lg bg-white"
            >
              <option value="todas">Todas as áreas</option>
              {(departments as string[]).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </div>

        {sortedPeople.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
            <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Nenhuma pessoa encontrada.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedPeople.map((emp) => {
              const empEvals = (evalsByEmployee.get(emp.id) || []).filter(e => e.status !== "em_andamento");
              const hasEvals = empEvals.length > 0;
              const gestorEval = empEvals.find(e => e.evaluationType === "gestor");
              const avg = gestorEval ? getAvgScore(gestorEval) : null;
              const totalAnswered = hasEvals ? empEvals[0].answers.filter(a => a.score !== null).length : 0;
              const evalTypes = [...new Set(empEvals.map(e => e.evaluationType))];

              return (
                <div
                  key={emp.id}
                  className="group bg-white rounded-xl p-5 shadow-sm border transition border-gray-100 hover:shadow-md hover:border-primary/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {emp.photoUrl && emp.photoUrl !== "#N/A" ? (
                        <img
                          src={emp.photoUrl}
                          alt={emp.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                          {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{emp.name}</h3>
                        <p className="text-xs text-gray-500">{emp.cargo} · {emp.sector}</p>
                        {hasEvals && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {evalTypes.map((t) => (
                              <span key={t} className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {evaluationTypeLabels[t as EvaluationType]}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {hasEvals ? (
                        <>
                          <div className="text-center">
                            <p className="text-lg font-bold text-gray-900">
                              {avg !== null ? avg.toFixed(1) : "—"}
                            </p>
                            <p className="text-xs text-gray-400">Média</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-700">
                              {empEvals.length}
                            </p>
                            <p className="text-xs text-gray-400">Aval.</p>
                          </div>
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-accent bg-accent/10">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Concluída
                            </span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Sem avaliação</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
