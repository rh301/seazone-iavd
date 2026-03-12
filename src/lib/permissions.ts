import { User } from "./auth-types";
import { users } from "@/data/users";

/**
 * Retorna todos os subordinados diretos e indiretos de um usuário
 */
export function getSubordinates(userId: string): User[] {
  const direct = users.filter((u) => u.managerId === userId);
  const indirect = direct.flatMap((d) => getSubordinates(d.id));
  return [...direct, ...indirect];
}

/**
 * Retorna os liderados diretos (quem o usuário deve avaliar)
 */
export function getDirectReports(userId: string): User[] {
  return users.filter((u) => u.managerId === userId);
}

/**
 * Retorna todos os usuários cujas avaliações o usuário logado pode ver
 */
export function getVisibleUsers(currentUser: User): User[] {
  switch (currentUser.role) {
    case "c_level":
    case "rh":
      // Vê todos
      return users.filter((u) => u.id !== currentUser.id);

    case "diretor":
      // Vê todos da sua área (departamento) — diretos e indiretos
      return getSubordinates(currentUser.id);

    case "coordenador":
      // Vê seus liderados diretos
      return getDirectReports(currentUser.id);

    case "colaborador":
      // Não vê ninguém além de si mesmo (só recebe avaliação)
      return [];
  }
}

/**
 * Retorna as pessoas que o usuário logado deve avaliar
 */
export function getEvaluatableUsers(currentUser: User): User[] {
  // Somente quem tem liderados diretos pode avaliar
  return getDirectReports(currentUser.id);
}

/**
 * Verifica se o usuário pode ver uma avaliação específica
 */
export function canViewEvaluation(
  currentUser: User,
  evaluatedUserId: string,
  evaluatorId: string
): boolean {
  // C-Level e RH veem tudo
  if (currentUser.role === "c_level" || currentUser.role === "rh") {
    return true;
  }

  // Se é o avaliador, pode ver
  if (currentUser.id === evaluatorId) {
    return true;
  }

  // Diretor vê avaliações da sua área
  if (currentUser.role === "diretor") {
    const subs = getSubordinates(currentUser.id);
    return subs.some((s) => s.id === evaluatedUserId);
  }

  // Coordenador vê avaliações dos seus liderados diretos
  if (currentUser.role === "coordenador") {
    const directs = getDirectReports(currentUser.id);
    return directs.some((d) => d.id === evaluatedUserId);
  }

  return false;
}

/**
 * Verifica se o usuário pode gerenciar perguntas (admin)
 */
export function canManageQuestions(currentUser: User): boolean {
  return ["c_level", "rh", "diretor"].includes(currentUser.role);
}

/**
 * Retorna estatísticas de avaliação da equipe para dashboards de gestão
 */
export function getTeamStats(currentUser: User) {
  const visibleUsers = getVisibleUsers(currentUser);
  const evaluatable = getEvaluatableUsers(currentUser);

  return {
    totalVisible: visibleUsers.length,
    totalToEvaluate: evaluatable.length,
    visibleUsers,
    evaluatableUsers: evaluatable,
  };
}
