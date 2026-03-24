"use client";

import { Question, Answer } from "./types";
import { defaultQuestions } from "@/data/questions";

// ── Questions (local config — same for all users) ──

export function getQuestions(): Question[] {
  if (typeof window === "undefined") return defaultQuestions;
  const stored = localStorage.getItem("avd_questions");
  return stored ? JSON.parse(stored) : defaultQuestions;
}

export function saveQuestions(questions: Question[]) {
  localStorage.setItem("avd_questions", JSON.stringify(questions));
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

// ── Empty answers factory (pure function, no storage) ──

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
