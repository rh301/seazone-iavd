import { supabase } from "./supabase";
import { Evaluation, EvaluationType, ChatMessage, DirectorInsight } from "./types";
import { generatePeerAssignments, type PeerAssignment } from "./peer-assignment";

// ── Helper to map DB rows to Evaluation objects ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Evaluation {
  return {
    id: row.id,
    employeeId: row.employee_id,
    evaluatorId: row.evaluator_id,
    evaluationType: row.evaluation_type as EvaluationType,
    status: row.status,
    date: row.date,
    answers: row.answers || [],
    calibration: row.calibration || undefined,
  };
}

// ── Evaluations ──

/** Fetch ALL evaluations — use only in admin/RH pages (calibração, resultados, gestão) */
export async function fetchEvaluations(): Promise<Evaluation[]> {
  const { data, error } = await supabase
    .from("evaluations")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching evaluations:", error);
    return [];
  }

  return (data || []).map(mapRow);
}

/** Fetch evaluations where user is the evaluator (for dashboard, avaliação page) */
export async function fetchEvaluationsByEvaluator(evaluatorId: string): Promise<Evaluation[]> {
  const { data, error } = await supabase
    .from("evaluations")
    .select("*")
    .eq("evaluator_id", evaluatorId)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching evaluations by evaluator:", error);
    return [];
  }

  return (data || []).map(mapRow);
}

/** Fetch evaluations where user is being evaluated (for minhas-notas) */
export async function fetchEvaluationsByEmployee(employeeId: string, type?: EvaluationType): Promise<Evaluation[]> {
  let query = supabase
    .from("evaluations")
    .select("*")
    .eq("employee_id", employeeId);

  if (type) query = query.eq("evaluation_type", type);

  const { data, error } = await query.order("date", { ascending: false });

  if (error) {
    console.error("Error fetching evaluations by employee:", error);
    return [];
  }

  return (data || []).map(mapRow);
}

/** Fetch evaluations for a specific evaluator+employee pair */
export async function fetchEvaluationsByPair(evaluatorId: string, employeeId: string): Promise<Evaluation[]> {
  const { data, error } = await supabase
    .from("evaluations")
    .select("*")
    .eq("evaluator_id", evaluatorId)
    .eq("employee_id", employeeId)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching evaluations by pair:", error);
    return [];
  }

  return (data || []).map(mapRow);
}

/** Fetch evaluations filtered by type and status (for historico, calibração filtered views) */
export async function fetchEvaluationsByType(type: EvaluationType, status?: string): Promise<Evaluation[]> {
  let query = supabase
    .from("evaluations")
    .select("*")
    .eq("evaluation_type", type);

  if (status) query = query.eq("status", status);

  const { data, error } = await query.order("date", { ascending: false });

  if (error) {
    console.error("Error fetching evaluations by type:", error);
    return [];
  }

  return (data || []).map(mapRow);
}

export async function fetchEvaluation(id: string): Promise<Evaluation | null> {
  const { data, error } = await supabase
    .from("evaluations")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    employeeId: data.employee_id,
    evaluatorId: data.evaluator_id,
    evaluationType: data.evaluation_type as EvaluationType,
    status: data.status,
    date: data.date,
    answers: data.answers || [],
    calibration: data.calibration || undefined,
  };
}

export async function upsertEvaluation(evaluation: Evaluation): Promise<void> {
  const { error } = await supabase.from("evaluations").upsert({
    id: evaluation.id,
    employee_id: evaluation.employeeId,
    evaluator_id: evaluation.evaluatorId,
    evaluation_type: evaluation.evaluationType,
    status: evaluation.status,
    date: evaluation.date,
    answers: evaluation.answers,
    calibration: evaluation.calibration || null,
    updated_at: new Date().toISOString(),
  });

  if (error) console.error("Error saving evaluation:", error);
}

export async function removeEvaluation(evalId: string): Promise<void> {
  const { error } = await supabase.from("evaluations").delete().eq("id", evalId);
  if (error) console.error("Error deleting evaluation:", error);
}

export async function removeEvaluationsForEmployee(employeeId: string): Promise<void> {
  const { error } = await supabase
    .from("evaluations")
    .delete()
    .eq("employee_id", employeeId);
  if (error) console.error("Error deleting evaluations:", error);
}

// ── Peer Assignments ──

export async function fetchPeerAssignments(): Promise<PeerAssignment[]> {
  const { data, error } = await supabase.from("peer_assignments").select("*");

  if (error || !data || data.length === 0) {
    // Generate and save if empty
    const assignments = generatePeerAssignments();
    await savePeerAssignments(assignments);
    return assignments;
  }

  return data.map((row) => ({
    evaluatorId: row.evaluator_id,
    evaluateeId: row.evaluatee_id,
  }));
}

export async function savePeerAssignments(assignments: PeerAssignment[]): Promise<void> {
  // Clear existing
  await supabase.from("peer_assignments").delete().neq("id", 0);

  if (assignments.length === 0) return;

  // Insert in batches of 500
  for (let i = 0; i < assignments.length; i += 500) {
    const batch = assignments.slice(i, i + 500).map((a) => ({
      evaluator_id: a.evaluatorId,
      evaluatee_id: a.evaluateeId,
    }));
    const { error } = await supabase.from("peer_assignments").insert(batch);
    if (error) console.error("Error saving peer assignments batch:", error);
  }
}

export async function modifyPeerAssignment(
  evaluatorId: string,
  oldEvaluateeId: string,
  newEvaluateeId: string
): Promise<void> {
  const { error } = await supabase
    .from("peer_assignments")
    .update({ evaluatee_id: newEvaluateeId })
    .eq("evaluator_id", evaluatorId)
    .eq("evaluatee_id", oldEvaluateeId);
  if (error) console.error("Error updating peer assignment:", error);
}

export async function addPeerAssignment(evaluatorId: string, evaluateeId: string): Promise<void> {
  const { error } = await supabase.from("peer_assignments").insert({
    evaluator_id: evaluatorId,
    evaluatee_id: evaluateeId,
  });
  if (error) console.error("Error adding peer assignment:", error);
}

export async function removePeerAssignment(evaluatorId: string, evaluateeId: string): Promise<void> {
  const { error } = await supabase
    .from("peer_assignments")
    .delete()
    .eq("evaluator_id", evaluatorId)
    .eq("evaluatee_id", evaluateeId);
  if (error) console.error("Error removing peer assignment:", error);
}

export async function regenerateAndSavePeers(seed?: number): Promise<PeerAssignment[]> {
  const assignments = generatePeerAssignments(seed);
  await savePeerAssignments(assignments);
  return assignments;
}

// ── App Settings ──

export async function fetchNotesReleased(): Promise<boolean> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "notes_released")
    .single();

  if (error || !data) return false;
  return data.value === "true";
}

export async function updateNotesReleased(released: boolean): Promise<void> {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "notes_released", value: released ? "true" : "false", updated_at: new Date().toISOString() });
  if (error) console.error("Error updating notes released:", error);
}

// ── Manager Overrides ──

export async function fetchManagerOverrides(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "manager_overrides")
    .single();

  if (error || !data) return {};
  try {
    return JSON.parse(data.value);
  } catch {
    return {};
  }
}

export async function saveManagerOverrides(overrides: Record<string, string>): Promise<void> {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "manager_overrides", value: JSON.stringify(overrides), updated_at: new Date().toISOString() });
  if (error) console.error("Error saving manager overrides:", error);
}

// ── Results Access Control ──
// Format: Record<userId, string[]> — userId can see these people IDs
// If userId is in the map, they have access to /resultados and see only the listed people
// C-Level and RH always have full access (not stored here)

export interface ResultsAccessConfig {
  accessList: Record<string, string[]>; // userId -> array of visible people IDs
}

export async function fetchResultsAccess(): Promise<ResultsAccessConfig> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "results_access")
    .single();

  if (error || !data) return { accessList: {} };
  try {
    return JSON.parse(data.value);
  } catch {
    return { accessList: {} };
  }
}

export async function saveResultsAccess(config: ResultsAccessConfig): Promise<void> {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "results_access", value: JSON.stringify(config), updated_at: new Date().toISOString() });
  if (error) console.error("Error saving results access:", error);
}

// ── Calibration Schedule ──

export interface CalibrationAreaProgress {
  area: string;
  totalPeople: number;
  calibratedPeople: string[];
  order: number;
  updatedBy: string;
  updatedAt: string;
}

export interface CalibrationScheduleConfig {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  minutesPerPerson: number;
  areas: CalibrationAreaProgress[];
}

export async function fetchCalibrationSchedule(): Promise<CalibrationScheduleConfig> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "calibration_schedule")
    .single();

  if (error || !data) return { date: "", startTime: "09:00", minutesPerPerson: 5, areas: [] };
  try {
    return JSON.parse(data.value);
  } catch {
    return { date: "", startTime: "09:00", minutesPerPerson: 5, areas: [] };
  }
}

export async function saveCalibrationSchedule(config: CalibrationScheduleConfig): Promise<void> {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "calibration_schedule", value: JSON.stringify(config), updated_at: new Date().toISOString() });
  if (error) console.error("Error saving calibration schedule:", error);
}

export async function fetchCalibrationProgress(): Promise<CalibrationAreaProgress[]> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "calibration_progress")
    .single();

  if (error || !data) return [];
  try {
    return JSON.parse(data.value);
  } catch {
    return [];
  }
}

export async function saveCalibrationProgress(progress: CalibrationAreaProgress[]): Promise<void> {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "calibration_progress", value: JSON.stringify(progress), updated_at: new Date().toISOString() });
  if (error) console.error("Error saving calibration progress:", error);
}
