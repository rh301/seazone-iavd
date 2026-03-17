import { users } from "@/data/users";
import { sectors } from "@/data/sectors";

export interface PeerAssignment {
  evaluatorId: string;
  evaluateeId: string;
}

// Build lookups
const sectorParent = new Map(sectors.map((s) => [s.name, s.parentSector]));
const sectorByName = new Map(sectors.map((s) => [s.name, s]));

const childSectors = new Map<string, string[]>();
for (const s of sectors) {
  if (s.parentSector) {
    const list = childSectors.get(s.parentSector) || [];
    list.push(s.name);
    childSectors.set(s.parentSector, list);
  }
}

// Who is responsável of which sectors
const responsavelSectors = new Map<string, string[]>();
for (const s of sectors) {
  const list = responsavelSectors.get(s.responsavelName) || [];
  list.push(s.name);
  responsavelSectors.set(s.responsavelName, list);
}

const userById = new Map(users.map((u) => [u.id, u]));
const userByName = new Map(users.map((u) => [u.name, u]));

// Setores isolados
const ISOLATED_SECTORS = new Set(["Estagiários", "Jovens Talentos"]);

/** Check if a user is responsável of any sector */
function isResponsavel(userId: string): boolean {
  const user = userById.get(userId);
  if (!user) return false;
  return (responsavelSectors.get(user.name) || []).length > 0;
}

/** Deterministic shuffle */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate peer assignments for the entire company.
 *
 * Rules:
 * - If person is RESPONSÁVEL of a sector: peers = other responsáveis of sibling sectors (same level)
 * - If person is NOT responsável (analyst): peers = other people in the SAME sector (same team)
 * - Isolated sectors (Estagiários, Jovens Talentos): peers only within themselves
 * - Each person evaluates exactly 2 peers (when pool allows)
 * - Everyone receives at least 1 peer evaluation
 */
export function generatePeerAssignments(seed: number = 42): PeerAssignment[] {
  const assignments: PeerAssignment[] = [];
  const peerGroups = new Map<string, string[]>();

  for (const user of users) {
    if (ISOLATED_SECTORS.has(user.sector)) {
      // Isolated: peers within same sector only
      const groupKey = `isolated:${user.sector}`;
      const group = peerGroups.get(groupKey) || [];
      group.push(user.id);
      peerGroups.set(groupKey, group);
      continue;
    }

    if (isResponsavel(user.id)) {
      // Responsável: peers = other responsáveis of sibling sectors
      const sector = sectorByName.get(user.sector);
      if (!sector?.parentSector) continue;

      const groupKey = `resp:${sector.parentSector}`;
      const group = peerGroups.get(groupKey) || [];
      group.push(user.id);
      peerGroups.set(groupKey, group);
    } else {
      // Non-responsável: peers = other people in the same sector (same team)
      const groupKey = `team:${user.sector}`;
      const group = peerGroups.get(groupKey) || [];
      group.push(user.id);
      peerGroups.set(groupKey, group);
    }
  }

  for (const [groupKey, memberIds] of peerGroups) {
    if (memberIds.length <= 1) continue;

    const shuffled = seededShuffle(memberIds, seed + groupKey.length);

    if (memberIds.length === 2) {
      assignments.push({ evaluatorId: shuffled[0], evaluateeId: shuffled[1] });
      assignments.push({ evaluatorId: shuffled[1], evaluateeId: shuffled[0] });
      continue;
    }

    // Circular: person[i] evaluates person[(i+1)] and person[(i+2)]
    const n = shuffled.length;
    for (let i = 0; i < n; i++) {
      assignments.push({
        evaluatorId: shuffled[i],
        evaluateeId: shuffled[(i + 1) % n],
      });
      assignments.push({
        evaluatorId: shuffled[i],
        evaluateeId: shuffled[(i + 2) % n],
      });
    }
  }

  return assignments;
}

/** Get the peers that a specific user must evaluate */
export function getPeersToEvaluate(
  userId: string,
  assignments: PeerAssignment[]
): string[] {
  return assignments
    .filter((a) => a.evaluatorId === userId)
    .map((a) => a.evaluateeId);
}

/** Get who evaluates a specific user as peer */
export function getPeerEvaluators(
  userId: string,
  assignments: PeerAssignment[]
): string[] {
  return assignments
    .filter((a) => a.evaluateeId === userId)
    .map((a) => a.evaluatorId);
}
