"use client";

import { Question, Evaluation, Answer, ChatMessage } from "./types";
import { defaultQuestions } from "@/data/questions";

// Simple client-side store using localStorage
const STORAGE_KEYS = {
  questions: "avd_questions",
  evaluations: "avd_evaluations",
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
  }));
}
