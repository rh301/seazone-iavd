import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mapeamento nota numérica ↔ conceito A-E
export const scoreToGrade: Record<number, string> = { 5: "A", 4: "B", 3: "C", 2: "D", 1: "E" };
export const gradeToScore: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };

export function toGrade(score: number | null): string {
  if (score === null) return "—";
  const rounded = Math.round(score);
  return scoreToGrade[Math.min(5, Math.max(1, rounded))] || "C";
}

export function avgToGrade(avg: number | null): string {
  if (avg === null) return "—";
  if (avg >= 4.5) return "A";
  if (avg >= 3.5) return "B";
  if (avg >= 2.5) return "C";
  if (avg >= 1.5) return "D";
  return "E";
}
