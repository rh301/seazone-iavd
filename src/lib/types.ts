export interface ScaleLevel {
  score: number;
  label: string;
  description: string;
  examples: string[];
}

export interface Question {
  id: string;
  title: string;
  category: string;
  description: string;
  scale: ScaleLevel[];
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  sector: string;
  cargo: string;
  manager: string;
  avatarUrl?: string;
  photoUrl?: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface Answer {
  questionId: string;
  score: number | null;          // nota dada pela IA (não pelo gestor)
  justification: string;         // resposta do gestor à pergunta
  chatHistory: ChatMessage[];
  aiValidated: boolean;          // IA já deu a nota final
  contestation?: string;         // contestação do gestor (se houver)
  aiReasoning?: string;          // justificativa da IA para a nota
}

export interface DirectorInsight {
  questionId: string;
  userId: string;
  interpretation: string;
  updatedAt: string;
}

export interface CalibrationEntry {
  originalScore: number;
  calibratedScore: number;
  comment: string;
  calibratedBy: string;
  calibratedAt: string;
}

export type EvaluationType = "auto" | "gestor" | "par" | "liderado";

export const evaluationTypeLabels: Record<EvaluationType, string> = {
  auto: "Autoavaliação",
  gestor: "Avaliar Liderado",
  par: "Avaliação de Par",
  liderado: "Avaliar meu Gestor",
};

/** Labels do ponto de vista de quem recebe a avaliação (para resultados/histórico) */
export const evaluationTypeResultLabels: Record<EvaluationType, string> = {
  auto: "Autoavaliação",
  gestor: "Gestor",
  par: "Par",
  liderado: "Liderado",
};

export const evaluationTypeColors: Record<EvaluationType, string> = {
  auto: "bg-blue-100 text-blue-700",
  gestor: "bg-amber-100 text-amber-700",
  par: "bg-emerald-100 text-emerald-700",
  liderado: "bg-purple-100 text-purple-700",
};

export interface Evaluation {
  id: string;
  employeeId: string;
  evaluatorId: string;
  evaluationType: EvaluationType;
  date: string;
  status: "em_andamento" | "concluida" | "calibrada";
  answers: Answer[];
  calibration?: {
    entries: Record<string, CalibrationEntry>;
    calibratedBy: string;
    calibratedAt: string;
  };
}
