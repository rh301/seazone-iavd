"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { canCalibrate } from "@/lib/permissions";
import {
  fetchEvaluations,
  fetchPeerAssignments,
  removeEvaluation,
  removeEvaluationsForEmployee,
  modifyPeerAssignment,
  regenerateAndSavePeers,
} from "@/lib/db";
import { getAllUsers, findUser, getPeerPool, getManager } from "@/lib/org-tree";
import { getPeersToEvaluate, type PeerAssignment } from "@/lib/peer-assignment";
import { Evaluation, evaluationTypeLabels, EvaluationType } from "@/lib/types";
import AppShell from "@/components/app-shell";
import {
  Search,
  ShieldAlert,
  Users,
  UserCog,
  Trash2,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export default function GestaoPage() {
  const { user } = useAuth();
  const [nameSearch, setNameSearch] = useState("");
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [peerAssignments, setPeerAssignments] = useState<PeerAssignment[]>([]);
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [changingPeer, setChangingPeer] = useState<{
    evaluatorId: string;
    oldEvaluateeId: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      const evals = await fetchEvaluations();
      setEvaluations(evals);
      const peers = await fetchPeerAssignments();
      setPeerAssignments(peers);
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
          <p className="text-gray-500 mt-1">Apenas o RH pode acessar esta página.</p>
        </div>
      </AppShell>
    );
  }

  const allPeople = getAllUsers();

  const filtered = nameSearch.length >= 2
    ? allPeople.filter((p) => {
        const q = nameSearch.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sector.toLowerCase().includes(q) ||
          p.cargo.toLowerCase().includes(q)
        );
      })
    : [];

  async function refresh() {
    const evals = await fetchEvaluations();
    setEvaluations(evals);
    const peers = await fetchPeerAssignments();
    setPeerAssignments(peers);
  }

  async function handleDeleteEval(evalId: string) {
    if (!confirm("Excluir esta avaliação? Isso não pode ser desfeito.")) return;
    await removeEvaluation(evalId);
    await refresh();
  }

  async function handleResetPerson(employeeId: string, name: string) {
    if (!confirm(`Resetar TODAS as avaliações de ${name}? Isso não pode ser desfeito.`)) return;
    await removeEvaluationsForEmployee(employeeId);
    await refresh();
  }

  async function handleChangePeer(evaluatorId: string, oldEvaluateeId: string, newEvaluateeId: string) {
    await modifyPeerAssignment(evaluatorId, oldEvaluateeId, newEvaluateeId);
    setChangingPeer(null);
    await refresh();
  }

  async function handleRegeneratePeers() {
    if (!confirm("Regenerar TODOS os pares? As atribuições atuais serão perdidas.")) return;
    const seed = Math.floor(Math.random() * 10000);
    await regenerateAndSavePeers(seed);
    await refresh();
  }

  return (
    <AppShell>
      <div>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <UserCog className="w-7 h-7 text-primary" />
              Gestão
            </h1>
            <p className="text-gray-500 mt-1">
              Gerencie pessoas, pares e avaliações
            </p>
          </div>
          <button
            onClick={handleRegeneratePeers}
            className="flex items-center gap-2 px-4 py-2 border border-secondary/30 text-secondary rounded-xl text-sm font-medium hover:bg-secondary/5 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerar todos os pares
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            placeholder="Buscar pessoa por nome, setor ou cargo (mín. 2 letras)..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {nameSearch.length < 2 && (
          <div className="text-center py-16 text-gray-400">
            Digite pelo menos 2 letras para buscar
          </div>
        )}

        {nameSearch.length >= 2 && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            Nenhuma pessoa encontrada
          </div>
        )}

        {/* Person list */}
        <div className="space-y-3">
          {filtered.map((person) => {
            const isExpanded = expandedPerson === person.id;
            const manager = getManager(person.id);
            const managerUser = manager ? findUser(manager.id) : null;
            const personPeers = getPeersToEvaluate(person.id, peerAssignments);
            const personEvals = evaluations.filter((e) => e.employeeId === person.id);
            const peerPool = getPeerPool(person.id);

            return (
              <div key={person.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setExpandedPerson(isExpanded ? null : person.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    {person.photoUrl && person.photoUrl !== "#N/A" ? (
                      <img src={person.photoUrl} alt={person.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                        {person.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{person.name}</h3>
                      <p className="text-xs text-gray-500">{person.cargo} · {person.sector}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {personEvals.length > 0 && (
                      <span className="text-xs text-gray-500">{personEvals.length} aval.</span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 space-y-5">
                    {/* Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Gestor</p>
                        <p className="text-sm font-medium text-gray-900">
                          {managerUser?.name || "Sem gestor"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Setor</p>
                        <p className="text-sm font-medium text-gray-900">{person.sector}</p>
                      </div>
                    </div>

                    {/* Pares */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        Pares atribuídos ({personPeers.length})
                      </h4>
                      {personPeers.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Sem pares atribuídos</p>
                      ) : (
                        <div className="space-y-2">
                          {personPeers.map((peerId) => {
                            const peer = findUser(peerId);
                            const isChanging = changingPeer?.evaluatorId === person.id && changingPeer?.oldEvaluateeId === peerId;

                            return (
                              <div key={peerId} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{peer?.name || peerId}</p>
                                  <p className="text-xs text-gray-500">{peer?.sector}</p>
                                </div>
                                {isChanging ? (
                                  <div className="flex items-center gap-2">
                                    <select
                                      className="text-xs border border-gray-200 rounded-lg px-2 py-1"
                                      defaultValue=""
                                      onChange={(e) => {
                                        if (e.target.value) handleChangePeer(person.id, peerId, e.target.value);
                                      }}
                                    >
                                      <option value="">Selecionar novo par...</option>
                                      {peerPool
                                        .filter((p) => p.id !== person.id && !personPeers.includes(p.id))
                                        .map((p) => (
                                          <option key={p.id} value={p.id}>{p.name} ({p.sector})</option>
                                        ))}
                                    </select>
                                    <button
                                      onClick={() => setChangingPeer(null)}
                                      className="text-xs text-gray-400 hover:text-gray-600"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setChangingPeer({ evaluatorId: person.id, oldEvaluateeId: peerId })}
                                    className="text-xs text-primary hover:text-primary-dark font-medium"
                                  >
                                    Trocar
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Avaliações */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-accent" />
                          Avaliações ({personEvals.length})
                        </span>
                        {personEvals.length > 0 && (
                          <button
                            onClick={() => handleResetPerson(person.id, person.name)}
                            className="flex items-center gap-1 text-xs text-danger hover:text-danger/80 font-medium"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            Resetar todas
                          </button>
                        )}
                      </h4>
                      {personEvals.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Nenhuma avaliação</p>
                      ) : (
                        <div className="space-y-2">
                          {personEvals.map((ev) => {
                            const evaluator = findUser(ev.evaluatorId);
                            const scores = ev.answers.map((a) => a.score).filter((s): s is number => s !== null);
                            const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—";

                            return (
                              <div key={ev.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                                      {evaluationTypeLabels[ev.evaluationType as EvaluationType] || ev.evaluationType}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      por {evaluator?.name || "Desconhecido"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    Média: {avg} · Status: {ev.status} · {ev.date}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleDeleteEval(ev.id)}
                                  className="p-1.5 text-gray-400 hover:text-danger transition"
                                  title="Excluir avaliação"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
