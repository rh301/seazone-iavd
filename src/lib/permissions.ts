import { User } from "./auth-types";
import { EvaluationType } from "./types";
import {
  getManager,
  getSubordinates as getOrgSubordinates,
  getAllUsers,
  findUser,
} from "./org-tree";
import { getPeersToEvaluate, type PeerAssignment } from "./peer-assignment";

export interface EvaluationTask {
  evaluateeId: string;
  evaluateeName: string;
  evaluateeSector: string;
  evaluateeCargo: string;
  evaluateePhotoUrl: string | null;
  evaluationType: EvaluationType;
}

/**
 * Returns ALL evaluations a user must complete (360 model)
 */
export function getRequiredEvaluations(
  userId: string,
  peerAssignments: PeerAssignment[]
): EvaluationTask[] {
  const tasks: EvaluationTask[] = [];
  const user = findUser(userId);
  if (!user) return tasks;

  // 1. Autoavaliação — always
  tasks.push({
    evaluateeId: user.id,
    evaluateeName: user.name,
    evaluateeSector: user.sector,
    evaluateeCargo: user.cargo,
    evaluateePhotoUrl: user.photoUrl,
    evaluationType: "auto",
  });

  // 2. Gestor — evaluate direct subordinates (if Responsável)
  const subordinates = getOrgSubordinates(userId);
  for (const sub of subordinates) {
    tasks.push({
      evaluateeId: sub.id,
      evaluateeName: sub.name,
      evaluateeSector: sub.sector,
      evaluateeCargo: sub.cargo,
      evaluateePhotoUrl: sub.photoUrl,
      evaluationType: "gestor",
    });
  }

  // 3. Pares — evaluate 2 assigned peers
  const peerIds = getPeersToEvaluate(userId, peerAssignments);
  for (const peerId of peerIds) {
    const peer = findUser(peerId);
    if (peer) {
      tasks.push({
        evaluateeId: peer.id,
        evaluateeName: peer.name,
        evaluateeSector: peer.sector,
        evaluateeCargo: peer.cargo,
        evaluateePhotoUrl: peer.photoUrl,
        evaluationType: "par",
      });
    }
  }

  // 4. Liderado — evaluate your direct manager
  const manager = getManager(userId);
  if (manager) {
    const managerUser = findUser(manager.id);
    if (managerUser) {
      tasks.push({
        evaluateeId: managerUser.id,
        evaluateeName: managerUser.name,
        evaluateeSector: managerUser.sector,
        evaluateeCargo: managerUser.cargo,
        evaluateePhotoUrl: managerUser.photoUrl,
        evaluationType: "liderado",
      });
    }
  }

  return tasks;
}

/**
 * Get all subordinates (direct + indirect, recursive via org tree)
 */
export function getSubordinates(userId: string): User[] {
  return getOrgSubordinates(userId).map((ud) => {
    const u = findUser(ud.id);
    return u!;
  }).filter(Boolean);
}

/**
 * Get direct reports only
 */
export function getDirectReports(userId: string): User[] {
  return getOrgSubordinates(userId).map((ud) => {
    const u = findUser(ud.id);
    return u!;
  }).filter(Boolean);
}

/**
 * Returns users whose evaluations the logged-in user can view
 */
export function getVisibleUsers(currentUser: User): User[] {
  const allUsers = getAllUsers();

  switch (currentUser.role) {
    case "c_level":
    case "rh":
      return allUsers.filter((u) => u.id !== currentUser.id);

    case "diretor": {
      const subs = getSubordinates(currentUser.id);
      return subs;
    }

    case "coordenador": {
      const directs = getDirectReports(currentUser.id);
      return directs;
    }

    case "colaborador":
      return [];
  }
}

/**
 * Legacy: returns people the user can evaluate (now derived from getRequiredEvaluations)
 */
export function getEvaluatableUsers(currentUser: User): User[] {
  return getDirectReports(currentUser.id);
}

/**
 * Check if user can view a specific evaluation
 */
export function canViewEvaluation(
  currentUser: User,
  evaluatedUserId: string,
  evaluatorId: string
): boolean {
  if (currentUser.role === "c_level" || currentUser.role === "rh") return true;
  if (currentUser.id === evaluatorId) return true;

  if (currentUser.role === "diretor") {
    const subs = getSubordinates(currentUser.id);
    return subs.some((s) => s.id === evaluatedUserId);
  }

  if (currentUser.role === "coordenador") {
    const directs = getDirectReports(currentUser.id);
    return directs.some((d) => d.id === evaluatedUserId);
  }

  return false;
}

/**
 * Can manage questions (admin)
 */
export function canManageQuestions(currentUser: User): boolean {
  return ["c_level", "rh", "diretor"].includes(currentUser.role);
}

/**
 * Can calibrate evaluations (C-Levels + RH)
 */
const CALIBRATION_IDS = new Set([
  // C-Levels
  "fernando-silva-pereira",
  "bruno-eduardo-benetti",
  "monica-medeiros-gaspar-de-souza",
  "gustavo-cargnin-kremer",
  "matheus-alberto-ambrosi",
  // RH
  "lara-campideli-santos",
  "mario-lopes-de-andrade",
  "isabela-cenzi-portugal",
  "clara-alcantara-ferraz-cury",
  "jonas-trajano-dos-santos",
  "natalia-cruz-pedrosa",
  "julia-nardes-de-alcantara-cotrim",
]);

export function canCalibrate(currentUser: User): boolean {
  return CALIBRATION_IDS.has(currentUser.id);
}

/**
 * RH team members (can manage people, peers, evaluations)
 */
const RH_IDS = new Set([
  "lara-campideli-santos",
  "mario-lopes-de-andrade",
  "isabela-cenzi-portugal",
  "clara-alcantara-ferraz-cury",
  "jonas-trajano-dos-santos",
  "natalia-cruz-pedrosa",
  "julia-nardes-de-alcantara-cotrim",
]);

export function isRH(currentUser: User): boolean {
  return RH_IDS.has(currentUser.id);
}

/**
 * Can release notes to employees (only People manager)
 */
export function canReleaseNotes(currentUser: User): boolean {
  return currentUser.id === "mario-lopes-de-andrade";
}

/**
 * Team stats for dashboards
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
