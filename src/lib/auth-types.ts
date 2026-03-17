export type Role = "c_level" | "rh" | "diretor" | "coordenador" | "colaborador";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  sector: string;
  cargo: string;
  photoUrl: string | null;
  slackUrl: string | null;
  managerId: string | null;
}

export const roleLabels: Record<Role, string> = {
  c_level: "C-Level",
  rh: "RH",
  diretor: "Diretor(a)",
  coordenador: "Coordenador(a)",
  colaborador: "Colaborador(a)",
};

export const roleColors: Record<Role, string> = {
  c_level: "bg-purple-100 text-purple-700",
  rh: "bg-blue-100 text-blue-700",
  diretor: "bg-amber-100 text-amber-700",
  coordenador: "bg-emerald-100 text-emerald-700",
  colaborador: "bg-gray-100 text-gray-700",
};
