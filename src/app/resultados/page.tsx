"use client";

import { Fragment, useEffect, useState } from "react";
import {
  Evaluation,
  EvaluationType,
  evaluationTypeResultLabels,
  evaluationTypeColors,
} from "@/lib/types";
import { getQuestions } from "@/lib/store";
import { fetchEvaluations } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { isRH, getVisibleUsers } from "@/lib/permissions";
import { findUser, getAllUsers } from "@/lib/org-tree";
import { avgToGrade, toGrade } from "@/lib/utils";
import AppShell from "@/components/app-shell";
import {
  Search,
  Download,
  BarChart3,
  Users,
  TrendingUp,
  CheckCircle2,
  ChevronDown,
  Star,
  Percent,
  AlertCircle,
  Filter,
} from "lucide-react";

type PersonResult = {
  id: string;
  name: string;
  cargo: string;
  sector: string;
  photoUrl: string | null;
  evalsByType: Partial<Record<EvaluationType, Evaluation[]>>;
  avgByType: Partial<Record<EvaluationType, number>>;
  avgByQuestion: Record<string, number | null>;
  overallAvg: number | null;
  isCalibrated: boolean;
};

const typeOrder: EvaluationType[] = ["auto", "gestor", "par", "liderado"];

function getEffectiveScore(ev: Evaluation, questionId: string): number | null {
  if (ev.calibration?.entries[questionId]) {
    return ev.calibration.entries[questionId].calibratedScore;
  }
  const answer = ev.answers.find((a) => a.questionId === questionId);
  return answer?.score ?? null;
}

function avgScores(scores: (number | null)[]): number | null {
  const valid = scores.filter((s): s is number => s !== null);
  return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
}

export default function Resultados() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [nameSearch, setNameSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("todas");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const evals = await fetchEvaluations();
      setEvaluations(evals);
    }
    load();
  }, []);

  if (!user) return null;

  const isAdmin = isRH(user) || user.role === "c_level";
  const isLeader = isAdmin || user.role === "diretor" || user.role === "coordenador";

  if (!isLeader) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <BarChart3 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900">Sem permissão</h2>
          <p className="text-gray-500 mt-1">Esta página é restrita para lideranças.</p>
        </div>
      </AppShell>
    );
  }

  const questions = getQuestions();
  // RH/C-Level see everyone, others see only their subordinates
  const allPeople = isAdmin ? getAllUsers() : getVisibleUsers(user);
  const completed = evaluations.filter(
    (e) => e.status === "concluida" || e.status === "calibrada"
  );

  // Build per-person results
  const evalsByEmployee = new Map<string, Evaluation[]>();
  for (const e of completed) {
    const list = evalsByEmployee.get(e.employeeId) || [];
    list.push(e);
    evalsByEmployee.set(e.employeeId, list);
  }

  const people: PersonResult[] = allPeople.map((p) => {
    const evals = evalsByEmployee.get(p.id) || [];
    const evalsByType: Partial<Record<EvaluationType, Evaluation[]>> = {};
    for (const e of evals) {
      const list = evalsByType[e.evaluationType] || [];
      list.push(e);
      evalsByType[e.evaluationType] = list;
    }

    const avgByType: Partial<Record<EvaluationType, number>> = {};
    for (const type of typeOrder) {
      const typeEvals = evalsByType[type];
      if (!typeEvals || typeEvals.length === 0) continue;
      const scores = typeEvals.flatMap((ev) =>
        questions.map((q) => getEffectiveScore(ev, q.id))
      );
      const avg = avgScores(scores);
      if (avg !== null) avgByType[type] = avg;
    }

    const avgByQuestion: Record<string, number | null> = {};
    for (const q of questions) {
      const scores = evals.flatMap((ev) => {
        const s = getEffectiveScore(ev, q.id);
        return s !== null ? [s] : [];
      });
      avgByQuestion[q.id] = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : null;
    }

    const allAvgs = Object.values(avgByType);
    const overallAvg =
      allAvgs.length > 0
        ? allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length
        : null;

    return {
      id: p.id,
      name: p.name,
      cargo: p.cargo,
      sector: p.sector,
      photoUrl: p.photoUrl,
      evalsByType,
      avgByType,
      avgByQuestion,
      overallAvg,
      isCalibrated: evals.some((e) => e.status === "calibrada"),
    };
  });

  const sectors = [...new Set(allPeople.map((p) => p.sector))].sort();
  const categories = [...new Set(questions.map((q) => q.category))];

  // Filter people
  const filtered = people.filter((p) => {
    if (sectorFilter !== "todas" && p.sector !== sectorFilter) return false;
    if (statusFilter === "completo" && p.overallAvg === null) return false;
    if (statusFilter === "pendente" && p.overallAvg !== null) return false;
    if (nameSearch.trim()) {
      const q = nameSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.cargo.toLowerCase().includes(q) ||
        p.sector.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.overallAvg !== null && b.overallAvg === null) return -1;
    if (a.overallAvg === null && b.overallAvg !== null) return 1;
    return a.name.localeCompare(b.name);
  });

  // ── Stats ──
  const peopleWithEvals = people.filter((p) => p.overallAvg !== null);
  const companyAvg = avgScores(peopleWithEvals.map((p) => p.overallAvg));
  const totalExpectedEvals = allPeople.length * 4;
  const totalCompleted = completed.length;
  const completionRate =
    totalExpectedEvals > 0 ? (totalCompleted / totalExpectedEvals) * 100 : 0;

  // Avg by category
  const avgByCategory = categories.map((cat) => {
    const catQuestions = questions.filter((q) => q.category === cat);
    const scores = peopleWithEvals.flatMap((p) =>
      catQuestions.map((q) => p.avgByQuestion[q.id]).filter((s): s is number => s !== null)
    );
    return {
      category: cat,
      avg: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    };
  });

  // Avg by type
  const avgByEvalType = typeOrder.map((type) => {
    const avgs = peopleWithEvals
      .map((p) => p.avgByType[type])
      .filter((s): s is number => s !== undefined);
    return {
      type,
      avg: avgs.length > 0 ? avgs.reduce((a, b) => a + b, 0) / avgs.length : 0,
      count: avgs.length,
    };
  });

  // Avg by sector
  const avgBySector = sectors
    .map((sector) => {
      const sectorPeople = peopleWithEvals.filter((p) => p.sector === sector);
      const avgs = sectorPeople
        .map((p) => p.overallAvg)
        .filter((s): s is number => s !== null);
      return {
        sector,
        avg: avgs.length > 0 ? avgs.reduce((a, b) => a + b, 0) / avgs.length : 0,
        count: sectorPeople.length,
      };
    })
    .filter((s) => s.count > 0)
    .sort((a, b) => b.avg - a.avg);

  // ── Export CSV ──
  async function handleExportCSV() {
    const xlsxModule = await import("xlsx");
    const XLSX = xlsxModule.default || xlsxModule;

    const header = [
      "Nome",
      "Cargo",
      "Setor",
      "Média Auto",
      "Média Gestor",
      "Média Par",
      "Média Liderado",
      "Média 360",
      ...questions.map((q) => q.title),
    ];

    const rows = sorted
      .filter((p) => p.overallAvg !== null)
      .map((p) => [
        p.name,
        p.cargo,
        p.sector,
        p.avgByType.auto !== undefined ? avgToGrade(p.avgByType.auto) : "",
        p.avgByType.gestor !== undefined ? avgToGrade(p.avgByType.gestor) : "",
        p.avgByType.par !== undefined ? avgToGrade(p.avgByType.par) : "",
        p.avgByType.liderado !== undefined ? avgToGrade(p.avgByType.liderado) : "",
        p.overallAvg !== null ? avgToGrade(p.overallAvg) : "",
        ...questions.map((q) => p.avgByQuestion[q.id] !== null ? avgToGrade(p.avgByQuestion[q.id]) : ""),
      ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);

    // Protect sheet — prevents editing without password
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ws as any)["!protect"] = {
      password: "seazone2026",
      sheet: true,
      objects: true,
      scenarios: true,
    };

    // Auto-fit column widths
    ws["!cols"] = header.map((h, i) => ({
      wch: Math.max(h.length, ...rows.map((r) => String(r[i] || "").length)) + 2,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados 360");

    XLSX.writeFile(wb, `avd_resultados_360_${new Date().toISOString().split("T")[0]}.xlsx`);
  }

  const scoreColor = (score: number) => {
    if (score >= 4.5) return "text-primary font-bold";
    if (score >= 3.5) return "text-green-600 font-bold";
    if (score >= 2.5) return "text-yellow-600 font-bold";
    if (score >= 1.5) return "text-orange-600 font-bold";
    return "text-red-600 font-bold";
  };

  const barColor = (score: number) => {
    if (score >= 4.5) return "#0f4c81";
    if (score >= 3.5) return "#22c55e";
    if (score >= 2.5) return "#eab308";
    if (score >= 1.5) return "#f97316";
    return "#ef4444";
  };

  return (
    <AppShell>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Resultados 360
            </h1>
            <p className="text-gray-500 mt-1">
              {isAdmin
                ? "Visão consolidada de todas as avaliações"
                : `Avaliações da sua equipe (${allPeople.length} pessoas)`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={handleExportCSV}
                disabled={peopleWithEvals.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent/90 transition disabled:opacity-30"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar Excel
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {peopleWithEvals.length}/{allPeople.length}
                </p>
                <p className="text-xs text-gray-500">Pessoas avaliadas</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {totalCompleted}
                </p>
                <p className="text-xs text-gray-500">Avaliações concluídas</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {companyAvg !== null ? avgToGrade(companyAvg) : "—"}
                </p>
                <p className="text-xs text-gray-500">Média geral 360</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Percent className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {completionRate.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500">Taxa de conclusão</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        {peopleWithEvals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Avg by Category */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-secondary" />
                Média por competência
              </h3>
              <div className="space-y-3">
                {avgByCategory
                  .sort((a, b) => b.avg - a.avg)
                  .map(({ category, avg }) => (
                    <div key={category} className="flex items-center gap-3">
                      <span
                        className="text-xs text-gray-600 w-36 truncate"
                        title={category}
                      >
                        {category}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(avg / 5) * 100}%`,
                            backgroundColor: barColor(avg),
                          }}
                        />
                      </div>
                      <span className={`text-xs w-8 text-right ${scoreColor(avg)}`}>
                        {avgToGrade(avg)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Avg by Eval Type */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Média por tipo de avaliação
              </h3>
              <div className="space-y-3">
                {avgByEvalType.map(({ type, avg, count }) => (
                  <div key={type} className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full w-36 text-center ${evaluationTypeColors[type]}`}
                    >
                      {evaluationTypeResultLabels[type]}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(avg / 5) * 100}%`,
                          backgroundColor: barColor(avg),
                        }}
                      />
                    </div>
                    <span className={`text-xs w-8 text-right ${scoreColor(avg)}`}>
                      {avg > 0 ? avgToGrade(avg) : "—"}
                    </span>
                    <span className="text-[10px] text-gray-400 w-6">
                      ({count})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Avg by Sector */}
        {avgBySector.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Média por setor
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {avgBySector.map(({ sector, avg, count }) => (
                <div key={sector} className="flex items-center gap-3">
                  <span
                    className="text-xs text-gray-600 w-44 truncate"
                    title={sector}
                  >
                    {sector}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(avg / 5) * 100}%`,
                        backgroundColor: barColor(avg),
                      }}
                    />
                  </div>
                  <span className={`text-xs w-8 text-right ${scoreColor(avg)}`}>
                    {avgToGrade(avg)}
                  </span>
                  <span className="text-[10px] text-gray-400 w-12">
                    {count} {count === 1 ? "pessoa" : "pessoas"}
                  </span>
                </div>
              ))}
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
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm px-3 py-2 border border-gray-200 rounded-lg bg-white"
            >
              <option value="todas">Todos</option>
              <option value="completo">Com avaliação</option>
              <option value="pendente">Sem avaliação</option>
            </select>
          </div>
          {sectors.length > 1 && (
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="text-sm px-3 py-2 border border-gray-200 rounded-lg bg-white"
            >
              <option value="todas">Todos os setores</option>
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {sorted.length} pessoas
          </span>
        </div>

        {/* People List */}
        {sorted.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
            <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Nenhuma pessoa encontrada.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((p) => {
              const isExpanded = expandedPerson === p.id;
              const hasEvals = p.overallAvg !== null;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedPerson(isExpanded ? null : p.id)
                    }
                    className="w-full p-5 text-left"
                    disabled={!hasEvals}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {p.photoUrl && p.photoUrl !== "#N/A" ? (
                          <img
                            src={p.photoUrl}
                            alt={p.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                            {p.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {p.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {p.cargo} · {p.sector}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {hasEvals ? (
                          <>
                            {typeOrder.map((type) => {
                              const avg = p.avgByType[type];
                              return (
                                <div
                                  key={type}
                                  className="text-center hidden md:block"
                                >
                                  <p
                                    className={`text-sm ${
                                      avg !== undefined
                                        ? scoreColor(avg)
                                        : "text-gray-300"
                                    }`}
                                  >
                                    {avg !== undefined ? avgToGrade(avg) : "—"}
                                  </p>
                                  <p className="text-[10px] text-gray-400">
                                    {evaluationTypeResultLabels[type]}
                                  </p>
                                </div>
                              );
                            })}
                            <div className="text-center pl-2 border-l border-gray-200">
                              <p
                                className={`text-lg ${scoreColor(
                                  p.overallAvg!
                                )}`}
                              >
                                {avgToGrade(p.overallAvg!)}
                              </p>
                              <p className="text-[10px] text-gray-400">360</p>
                            </div>
                            {p.isCalibrated && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                Calibrada
                              </span>
                            )}
                            <ChevronDown
                              className={`w-4 h-4 text-gray-400 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            Sem avaliação
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && hasEvals && (
                    <div className="px-5 pb-5 border-t border-gray-100">
                      <div className="overflow-x-auto mt-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500">
                                Competência
                              </th>
                              {typeOrder.map((type) => (
                                <th
                                  key={type}
                                  className="text-center py-2 px-2 text-xs font-medium"
                                >
                                  <span
                                    className={`px-2 py-0.5 rounded-full ${evaluationTypeColors[type]}`}
                                  >
                                    {evaluationTypeResultLabels[type]}
                                  </span>
                                </th>
                              ))}
                              <th className="text-center py-2 px-2 text-xs font-medium text-gray-700">
                                Média
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {categories.map((cat) => {
                              const catQuestions = questions.filter(
                                (q) => q.category === cat
                              );
                              return (
                                <Fragment key={cat}>
                                  <tr>
                                    <td
                                      colSpan={typeOrder.length + 2}
                                      className="pt-4 pb-1 text-xs font-semibold text-gray-700 uppercase tracking-wide"
                                    >
                                      {cat}
                                    </td>
                                  </tr>
                                  {catQuestions.map((q) => {
                                    const typeScores = typeOrder.map((type) => {
                                      const typeEvals =
                                        p.evalsByType[type] || [];
                                      const scores = typeEvals
                                        .map((ev) =>
                                          getEffectiveScore(ev, q.id)
                                        )
                                        .filter(
                                          (s): s is number => s !== null
                                        );
                                      return scores.length > 0
                                        ? scores.reduce((a, b) => a + b, 0) /
                                            scores.length
                                        : null;
                                    });
                                    const questionAvg = avgScores(typeScores);

                                    return (
                                      <tr
                                        key={q.id}
                                        className="border-b border-gray-50 hover:bg-gray-50/50"
                                      >
                                        <td
                                          className="py-2 pr-4 text-xs text-gray-600"
                                          title={q.title}
                                        >
                                          {q.title}
                                        </td>
                                        {typeScores.map((score, i) => (
                                          <td
                                            key={typeOrder[i]}
                                            className="text-center py-2 px-2"
                                          >
                                            {score !== null ? (
                                              <span
                                                className={`text-xs ${scoreColor(
                                                  score
                                                )}`}
                                              >
                                                {avgToGrade(score)}
                                              </span>
                                            ) : (
                                              <span className="text-xs text-gray-300">
                                                —
                                              </span>
                                            )}
                                          </td>
                                        ))}
                                        <td className="text-center py-2 px-2">
                                          {questionAvg !== null ? (
                                            <span
                                              className={`text-xs ${scoreColor(
                                                questionAvg
                                              )}`}
                                            >
                                              {avgToGrade(questionAvg)}
                                            </span>
                                          ) : (
                                            <span className="text-xs text-gray-300">
                                              —
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
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
