"use client";

import { Question, Evaluation, Answer, ChatMessage, DirectorInsight, EvaluationType } from "./types";
import { defaultQuestions } from "@/data/questions";
import { generatePeerAssignments, type PeerAssignment } from "./peer-assignment";

// Simple client-side store using localStorage
const STORAGE_KEYS = {
  questions: "avd_questions",
  evaluations: "avd_evaluations",
  directorInsights: "avd_director_insights",
  peerAssignments: "avd_peer_assignments",
  directorChats: "avd_director_chats",
};

export function getQuestions(): Question[] {
  if (typeof window === "undefined") return defaultQuestions;
  const stored = localStorage.getItem(STORAGE_KEYS.questions);
  return stored ? JSON.parse(stored) : defaultQuestions;
}

export function saveQuestions(questions: Question[]) {
  localStorage.setItem(STORAGE_KEYS.questions, JSON.stringify(questions));
}

export function saveQuestion(question: Question) {
  const questions = getQuestions();
  const index = questions.findIndex((q) => q.id === question.id);
  if (index >= 0) {
    questions[index] = question;
  } else {
    questions.push(question);
  }
  saveQuestions(questions);
}

export function deleteQuestion(id: string) {
  const questions = getQuestions().filter((q) => q.id !== id);
  saveQuestions(questions);
}

export function getEvaluations(): Evaluation[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.evaluations);
  return stored ? JSON.parse(stored) : [];
}

export function saveEvaluation(evaluation: Evaluation) {
  const evaluations = getEvaluations();
  const index = evaluations.findIndex((e) => e.id === evaluation.id);
  if (index >= 0) {
    evaluations[index] = evaluation;
  } else {
    evaluations.push(evaluation);
  }
  localStorage.setItem(STORAGE_KEYS.evaluations, JSON.stringify(evaluations));
}

export function getEvaluation(id: string): Evaluation | undefined {
  return getEvaluations().find((e) => e.id === id);
}

export function createEmptyAnswers(questions: Question[]): Answer[] {
  return questions.map((q) => ({
    questionId: q.id,
    score: null,
    justification: "",
    chatHistory: [],
    aiValidated: false,
    contestation: undefined,
    aiReasoning: undefined,
  }));
}

// Director Insights (interpretações da diretoria por critério)
export function getDirectorInsights(): DirectorInsight[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.directorInsights);
  return stored ? JSON.parse(stored) : [];
}

export function saveDirectorInsight(insight: DirectorInsight) {
  const insights = getDirectorInsights();
  const index = insights.findIndex(
    (i) => i.questionId === insight.questionId && i.userId === insight.userId
  );
  if (index >= 0) {
    insights[index] = insight;
  } else {
    insights.push(insight);
  }
  localStorage.setItem(STORAGE_KEYS.directorInsights, JSON.stringify(insights));
}

export function getInsightsForQuestion(questionId: string): DirectorInsight[] {
  return getDirectorInsights().filter((i) => i.questionId === questionId);
}

// Peer Assignments — version key to force regeneration on rule changes
const PEER_VERSION = "v3"; // bump when peer rules change

export function getPeerAssignments(): PeerAssignment[] {
  if (typeof window === "undefined") return [];
  const storedVersion = localStorage.getItem("avd_peer_version");
  if (storedVersion === PEER_VERSION) {
    const stored = localStorage.getItem(STORAGE_KEYS.peerAssignments);
    if (stored) return JSON.parse(stored);
  }
  // Generate fresh
  const assignments = generatePeerAssignments();
  localStorage.setItem(STORAGE_KEYS.peerAssignments, JSON.stringify(assignments));
  localStorage.setItem("avd_peer_version", PEER_VERSION);
  return assignments;
}

export function regeneratePeerAssignments(seed?: number): PeerAssignment[] {
  const assignments = generatePeerAssignments(seed);
  localStorage.setItem(STORAGE_KEYS.peerAssignments, JSON.stringify(assignments));
  return assignments;
}

// Notes release control (RH releases notes after calibration)
export function getNotesReleased(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("avd_notes_released") === "true";
}

export function setNotesReleased(released: boolean): void {
  localStorage.setItem("avd_notes_released", released ? "true" : "false");
}

// Director calibration chats
interface DirectorChatEntry {
  questionId: string;
  userId: string;
  messages: ChatMessage[];
  updatedAt: string;
}

function getAllDirectorChats(): DirectorChatEntry[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.directorChats);
  return stored ? JSON.parse(stored) : [];
}

export function getDirectorChat(questionId: string, userId: string): ChatMessage[] {
  const entry = getAllDirectorChats().find(
    (c) => c.questionId === questionId && c.userId === userId
  );
  return entry?.messages || [];
}

export function saveDirectorChat(questionId: string, userId: string, messages: ChatMessage[]): void {
  const chats = getAllDirectorChats();
  const idx = chats.findIndex((c) => c.questionId === questionId && c.userId === userId);
  const entry: DirectorChatEntry = {
    questionId,
    userId,
    messages,
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) chats[idx] = entry;
  else chats.push(entry);
  localStorage.setItem(STORAGE_KEYS.directorChats, JSON.stringify(chats));
}

export function hasDirectorChat(questionId: string, userId: string): boolean {
  return getDirectorChat(questionId, userId).length > 0;
}

// Delete a single evaluation
export function deleteEvaluation(evalId: string): void {
  const evals = getEvaluations().filter((e) => e.id !== evalId);
  localStorage.setItem(STORAGE_KEYS.evaluations, JSON.stringify(evals));
}

// Delete all evaluations for a person (as employee)
export function deleteEvaluationsForEmployee(employeeId: string): void {
  const evals = getEvaluations().filter((e) => e.employeeId !== employeeId);
  localStorage.setItem(STORAGE_KEYS.evaluations, JSON.stringify(evals));
}

// Delete all evaluations made by a person (as evaluator)
export function deleteEvaluationsByEvaluator(evaluatorId: string): void {
  const evals = getEvaluations().filter((e) => e.evaluatorId !== evaluatorId);
  localStorage.setItem(STORAGE_KEYS.evaluations, JSON.stringify(evals));
}

// Update peer assignments manually
export function updatePeerAssignment(
  evaluatorId: string,
  oldEvaluateeId: string,
  newEvaluateeId: string
): void {
  const assignments = getPeerAssignments();
  const idx = assignments.findIndex(
    (a) => a.evaluatorId === evaluatorId && a.evaluateeId === oldEvaluateeId
  );
  if (idx >= 0) {
    assignments[idx].evaluateeId = newEvaluateeId;
    localStorage.setItem(STORAGE_KEYS.peerAssignments, JSON.stringify(assignments));
  }
}

// Find existing evaluation by evaluator + employee + type
export function findEvaluation(
  evaluatorId: string,
  employeeId: string,
  evaluationType: EvaluationType
): Evaluation | undefined {
  return getEvaluations().find(
    (e) =>
      e.evaluatorId === evaluatorId &&
      e.employeeId === employeeId &&
      e.evaluationType === evaluationType
  );
}
