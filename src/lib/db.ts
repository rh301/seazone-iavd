import { supabase } from "./supabase";
import { Evaluation, DirectorInsight, ChatMessage, EvaluationType } from "./types";
import { generatePeerAssignments, type PeerAssignment } from "./peer-assignment";

// ── Evaluations ──

export async function fetchEvaluations(): Promise<Evaluation[]> {
  const { data, error } = await supabase
    .from("evaluations")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching evaluations:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    employeeId: row.employee_id,
    evaluatorId: row.evaluator_id,
    evaluationType: row.evaluation_type as EvaluationType,
    status: row.status,
    date: row.date,
    answers: row.answers || [],
    calibration: row.calibration || undefined,
  }));
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

// ── Director Insights ──

export async function fetchDirectorInsights(): Promise<DirectorInsight[]> {
  const { data, error } = await supabase.from("director_insights").select("*");
  if (error) return [];

  return (data || []).map((row) => ({
    questionId: row.question_id,
    userId: row.user_id,
    interpretation: row.interpretation,
    updatedAt: row.updated_at,
  }));
}

export async function fetchInsightsForQuestion(questionId: string): Promise<DirectorInsight[]> {
  const { data, error } = await supabase
    .from("director_insights")
    .select("*")
    .eq("question_id", questionId);
  if (error) return [];

  return (data || []).map((row) => ({
    questionId: row.question_id,
    userId: row.user_id,
    interpretation: row.interpretation,
    updatedAt: row.updated_at,
  }));
}

export async function upsertDirectorInsight(insight: DirectorInsight): Promise<void> {
  const { error } = await supabase.from("director_insights").upsert(
    {
      question_id: insight.questionId,
      user_id: insight.userId,
      interpretation: insight.interpretation,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "question_id,user_id" }
  );
  if (error) console.error("Error saving insight:", error);
}

// ── Director Chats ──

export async function fetchDirectorChat(
  questionId: string,
  userId: string
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("director_chats")
    .select("messages")
    .eq("question_id", questionId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return [];
  return data.messages || [];
}

export async function upsertDirectorChat(
  questionId: string,
  userId: string,
  messages: ChatMessage[]
): Promise<void> {
  const { error } = await supabase.from("director_chats").upsert(
    {
      question_id: questionId,
      user_id: userId,
      messages,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "question_id,user_id" }
  );
  if (error) console.error("Error saving director chat:", error);
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

// ── Calibration Progress ──

export interface CalibrationAreaProgress {
  area: string;
  totalPeople: number;
  calibratedPeople: string[]; // IDs of calibrated people
  order: number; // position in the schedule
  updatedBy: string;
  updatedAt: string;
}

export interface CalibrationScheduleConfig {
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

  if (error || !data) return { startTime: "09:00", minutesPerPerson: 5, areas: [] };
  try {
    return JSON.parse(data.value);
  } catch {
    return { startTime: "09:00", minutesPerPerson: 5, areas: [] };
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

export async function saveManagerOverrides(overrides: Record<string, string>): Promise<void> {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "manager_overrides", value: JSON.stringify(overrides), updated_at: new Date().toISOString() });
  if (error) console.error("Error saving manager overrides:", error);
}
