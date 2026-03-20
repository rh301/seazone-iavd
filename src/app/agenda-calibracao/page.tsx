"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { isRH } from "@/lib/permissions";
import { getAllUsers, getSubordinates, setManagerOverrides } from "@/lib/org-tree";
import {
  fetchCalibrationSchedule,
  saveCalibrationSchedule,
  fetchManagerOverrides,
  saveManagerOverrides,
  regenerateAndSavePeers,
  type CalibrationScheduleConfig,
} from "@/lib/db";
import AppShell from "@/components/app-shell";
import {
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Settings,
  Edit3,
  RotateCcw,
  UserCog,
} from "lucide-react";

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export default function AgendaCalibracao() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<CalibrationScheduleConfig>({
    startTime: "09:00",
    minutesPerPerson: 5,
    areas: [],
  });
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [editingPerson, setEditingPerson] = useState<string | null>(null);
  const [mgrOverrides, setMgrOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      const [s, overrides] = await Promise.all([
        fetchCalibrationSchedule(),
        fetchManagerOverrides(),
      ]);
      setSchedule(s);
      setMgrOverrides(overrides);
      setManagerOverrides(overrides);
      setInitialized(true);
    }
    load();
    const interval = setInterval(async () => {
      const s = await fetchCalibrationSchedule();
      setSchedule(s);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!user || !initialized) return null;

  const canEdit = isRH(user) || user.role === "c_level";
  const allPeople = getAllUsers();

  // Build tree
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

  // Init expanded nodes once
  if (expandedNodes.size === 0 && roots.length > 0) {
    const initial = new Set<string>();
    for (const root of roots) {
      initial.add(root.id);
      for (const child of childrenMap.get(root.id) || []) initial.add(child.id);
    }
    setTimeout(() => setExpandedNodes(initial), 0);
  }

  // Calculate times depth-first
  const timeMap = new Map<string, string>();
  let timeIdx = 0;
  function walkForTime(personId: string) {
    timeMap.set(personId, addMinutes(schedule.startTime, timeIdx * schedule.minutesPerPerson));
    timeIdx++;
    const children = (childrenMap.get(personId) || []).sort((a, b) => a.name.localeCompare(b.name));
    for (const c of children) walkForTime(c.id);
  }
  for (const root of [...roots].sort((a, b) => a.name.localeCompare(b.name))) walkForTime(root.id);

  // Calibrated tracking
  const calibratedSet = new Set<string>(
    schedule.areas.find((a) => a.area === "_calibrated")?.calibratedPeople || []
  );

  async function save(updated: CalibrationScheduleConfig) {
    setSchedule(updated);
    await saveCalibrationSchedule(updated);
  }

  function toggleCalibrated(personId: string) {
    if (!canEdit) return;
    const updated = { ...schedule, areas: schedule.areas.map((a) => ({ ...a })) };
    let cal = updated.areas.find((a) => a.area === "_calibrated");
    if (!cal) {
      cal = { area: "_calibrated", totalPeople: allPeople.length, calibratedPeople: [], order: 0, updatedBy: "", updatedAt: "" };
      updated.areas.push(cal);
    }
    cal.calibratedPeople = cal.calibratedPeople.includes(personId)
      ? cal.calibratedPeople.filter((id) => id !== personId)
      : [...cal.calibratedPeople, personId];
    cal.updatedBy = user!.id;
    cal.updatedAt = new Date().toISOString();
    save(updated);
  }

  async function handleMovePerson(personId: string, newManagerId: string) {
    const updated = { ...mgrOverrides, [personId]: newManagerId };
    await saveManagerOverrides(updated);
    setMgrOverrides(updated);
    setManagerOverrides(updated);
    setEditingPerson(null);
    await regenerateAndSavePeers();
    // Reload page to rebuild tree
    window.location.reload();
  }

  async function handleRestorePerson(personId: string) {
    const updated = { ...mgrOverrides };
    delete updated[personId];
    await saveManagerOverrides(updated);
    setMgrOverrides(updated);
    setManagerOverrides(updated);
    setEditingPerson(null);
    await regenerateAndSavePeers();
    window.location.reload();
  }

  function toggleNode(id: string) {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // Count descendants
  function countDescendants(id: string): { total: number; calibrated: number } {
    const children = childrenMap.get(id) || [];
    let total = children.length;
    let calibrated = children.filter((c) => calibratedSet.has(c.id)).length;
    for (const c of children) {
      const sub = countDescendants(c.id);
      total += sub.total;
      calibrated += sub.calibrated;
    }
    return { total, calibrated };
  }

  const totalCalibrated = calibratedSet.size;
  const overallPct = allPeople.length > 0 ? (totalCalibrated / allPeople.length) * 100 : 0;

  function renderNode(person: typeof allPeople[0], level: number) {
    const children = (childrenMap.get(person.id) || []).sort((a, b) => a.name.localeCompare(b.name));
    const hasChildren = children.length > 0;
    const isOpen = expandedNodes.has(person.id);
    const isEditing = editingPerson === person.id;
    const hasOverride = !!mgrOverrides[person.id];
    const isCalibrated = calibratedSet.has(person.id);
    const time = timeMap.get(person.id) || "--:--";
    const team = hasChildren ? countDescendants(person.id) : null;

    return (
      <div key={person.id}>
        <div
          className={`flex items-center gap-2 py-1.5 px-2 rounded-lg transition group ${isCalibrated ? "opacity-50" : ""}`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          <button className="w-4 h-4 flex items-center justify-center shrink-0" onClick={() => hasChildren && toggleNode(person.id)}>
            {hasChildren ? (isOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />) : <span className="w-1 h-1 bg-gray-300 rounded-full" />}
          </button>

          {canEdit && (
            <div
              className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer ${isCalibrated ? "bg-accent border-accent" : "border-gray-300 hover:border-gray-400"}`}
              onClick={() => toggleCalibrated(person.id)}
            >
              {isCalibrated && <CheckCircle2 className="w-3 h-3 text-white" />}
            </div>
          )}

          <span className="text-[10px] text-gray-400 w-10 shrink-0 font-mono">{time}</span>

          {person.photoUrl ? (
            <img src={person.photoUrl} alt={person.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-[9px] shrink-0">
              {person.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
          )}

          <div className="min-w-0 flex-1" onClick={() => hasChildren && toggleNode(person.id)}>
            <span className={`text-sm font-medium ${isCalibrated ? "line-through text-gray-400" : "text-gray-900"}`}>{person.name}</span>
            <span className="text-xs text-gray-400 ml-1.5">{person.cargo}</span>
            {hasOverride && <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-amber-100 text-amber-700 ml-1.5">mov.</span>}
          </div>

          {team && team.total > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-16 bg-gray-100 rounded-full h-1.5">
                <div className={`h-full rounded-full ${team.calibrated === team.total ? "bg-accent" : "bg-primary"}`} style={{ width: `${(team.calibrated / team.total) * 100}%` }} />
              </div>
              <span className="text-[10px] text-gray-400">{team.calibrated}/{team.total}</span>
            </div>
          )}

          {canEdit && (
            <button onClick={(e) => { e.stopPropagation(); setEditingPerson(isEditing ? null : person.id); }} className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-primary transition shrink-0" title="Mover">
              <Edit3 className="w-3 h-3" />
            </button>
          )}
        </div>

        {isEditing && canEdit && (
          <div className="my-1 p-2.5 bg-primary/5 border-l-2 border-primary rounded-r-lg" style={{ marginLeft: `${level * 20 + 32}px` }}>
            <p className="text-xs text-gray-600 mb-1.5 flex items-center gap-1">
              <UserCog className="w-3 h-3" /> Mover <span className="font-semibold">{person.name.split(" ")[0]}</span> para:
            </p>
            <select className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 mb-1.5" defaultValue="" onChange={(e) => { if (e.target.value) handleMovePerson(person.id, e.target.value); }}>
              <option value="">Selecionar gestor...</option>
              {allPeople.filter((p) => p.id !== person.id).sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {p.cargo} ({p.sector})</option>
              ))}
            </select>
            <div className="flex gap-2">
              {hasOverride && (
                <button onClick={() => handleRestorePerson(person.id)} className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <RotateCcw className="w-3 h-3" /> Restaurar
                </button>
              )}
              <button onClick={() => setEditingPerson(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
            </div>
          </div>
        )}

        {isOpen && children.map((child) => renderNode(child, level + 1))}
      </div>
    );
  }

  return (
    <AppShell>
      <div>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-primary" />
              Agenda de Calibração
            </h1>
            <p className="text-gray-500 mt-1">{schedule.minutesPerPerson}min por pessoa · {allPeople.length} pessoas</p>
          </div>
          {canEdit && (
            <button onClick={() => setShowSettings(!showSettings)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${showSettings ? "bg-primary text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              <Settings className="w-4 h-4" /> Configurar
            </button>
          )}
        </div>

        {showSettings && canEdit && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
            <div className="flex gap-6 flex-wrap">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Horário de início</label>
                <input type="time" value={schedule.startTime} onChange={(e) => save({ ...schedule, startTime: e.target.value })} className="text-sm border border-gray-200 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Min/pessoa</label>
                <input type="number" min={1} max={30} value={schedule.minutesPerPerson} onChange={(e) => save({ ...schedule, minutesPerPerson: parseInt(e.target.value) || 5 })} className="text-sm border border-gray-200 rounded-lg px-3 py-2 w-20" />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">{totalCalibrated} de {allPeople.length} pessoas</p>
            <span className="text-xl font-bold text-primary">{overallPct.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${overallPct}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Previsão: {schedule.startTime} – {addMinutes(schedule.startTime, allPeople.length * schedule.minutesPerPerson)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
          {[...roots].sort((a, b) => a.name.localeCompare(b.name)).map((root) => renderNode(root, 0))}
        </div>
      </div>
    </AppShell>
  );
}
