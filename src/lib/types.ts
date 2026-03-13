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
  manager: string;
  avatarUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface Answer {
  questionId: string;
  score: number | null;
  justification: string;
  chatHistory: ChatMessage[];
  aiValidated: boolean;
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

export interface Evaluation {
  id: string;
  employeeId: string;
  evaluatorId: string;
  date: string;
  status: "em_andamento" | "concluida" | "calibrada";
  answers: Answer[];
  calibration?: {
    entries: Record<string, CalibrationEntry>; // questionId -> entry
    calibratedBy: string;
    calibratedAt: string;
  };
}
