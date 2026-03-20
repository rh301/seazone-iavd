import { sectors } from "@/data/sectors";
import { users, type UserData } from "@/data/users";
import type { Role, User } from "./auth-types";

// Lookups (built once, cached)
const sectorByName = new Map(sectors.map((s) => [s.name, s]));
const usersByName = new Map(users.map((u) => [u.name, u]));
const userById = new Map(users.map((u) => [u.id, u]));

// Sectors where a person is Responsável (by user name)
const responsavelSectors = new Map<string, string[]>();
for (const s of sectors) {
  const list = responsavelSectors.get(s.responsavelName) || [];
  list.push(s.name);
  responsavelSectors.set(s.responsavelName, list);
}

// Children sectors by parent
const childSectors = new Map<string, string[]>();
for (const s of sectors) {
  if (s.parentSector) {
    const list = childSectors.get(s.parentSector) || [];
    list.push(s.name);
    childSectors.set(s.parentSector, list);
  }
}

// Manager overrides (loaded from DB, cached in module scope)
let managerOverrides: Record<string, string> = {};

export function setManagerOverrides(overrides: Record<string, string>) {
  managerOverrides = overrides;
}

export function getManagerOverrides(): Record<string, string> {
  return managerOverrides;
}

/** Get the manager (Responsável) of a person's sector */
export function getManager(userId: string): UserData | null {
  // Check override first
  if (managerOverrides[userId]) {
    return userById.get(managerOverrides[userId]) || null;
  }

  const user = userById.get(userId);
  if (!user) return null;

  const sector = sectorByName.get(user.sector);
  if (!sector) return null;

  const manager = usersByName.get(sector.responsavelName);
  if (!manager || manager.id === userId) {
    // If user IS the responsável, their manager is the responsável of the parent sector
    if (sector.parentSector) {
      const parentSector = sectorByName.get(sector.parentSector);
      if (parentSector) {
        const parentManager = usersByName.get(parentSector.responsavelName);
        if (parentManager && parentManager.id !== userId) return parentManager;
      }
    }
    return null;
  }
  return manager;
}

/** Get all direct subordinates: people in sectors where userId is Responsável + responsáveis of child sectors */
export function getSubordinates(userId: string): UserData[] {
  const user = userById.get(userId);
  if (!user) return [];

  const managedSectors = responsavelSectors.get(user.name) || [];
  const subs: UserData[] = [];
  const seen = new Set<string>();

  for (const sectorName of managedSectors) {
    // People directly in this sector
    for (const u of users) {
      if (u.sector === sectorName && u.id !== userId && !seen.has(u.id)) {
        subs.push(u);
        seen.add(u.id);
      }
    }

    // Responsáveis of child sectors (they report to this sector's responsável)
    const children = childSectors.get(sectorName) || [];
    for (const childName of children) {
      const childSector = sectorByName.get(childName);
      if (childSector) {
        const resp = usersByName.get(childSector.responsavelName);
        if (resp && resp.id !== userId && !seen.has(resp.id)) {
          subs.push(resp);
          seen.add(resp.id);
        }
      }
    }
  }

  return subs;
}

/** Get ALL subordinates recursively (direct + indirect), safe against circular refs */
export function getAllSubordinates(userId: string): UserData[] {
  const result: UserData[] = [];
  const visited = new Set<string>();
  visited.add(userId); // prevent self-inclusion

  function collect(id: string) {
    const direct = getSubordinates(id);
    for (const sub of direct) {
      if (!visited.has(sub.id)) {
        visited.add(sub.id);
        result.push(sub);
        collect(sub.id);
      }
    }
  }

  collect(userId);
  return result;
}

// Setores que formam seu próprio grupo de pares (não se misturam com irmãos)
const ISOLATED_SECTORS = new Set(["Estagiários", "Jovens Talentos"]);

/** Check if user is responsável of any sector */
function isUserResponsavel(userId: string): boolean {
  const user = userById.get(userId);
  if (!user) return false;
  return (responsavelSectors.get(user.name) || []).length > 0;
}

/**
 * Get peer pool for a user.
 * - Responsável: peers = other responsáveis of sibling sectors (same hierarchical level)
 * - Non-responsável: peers = other people in the same sector (same team)
 */
export function getPeerPool(userId: string): UserData[] {
  const user = userById.get(userId);
  if (!user) return [];

  // Isolated sectors: peers only within the same sector
  if (ISOLATED_SECTORS.has(user.sector)) {
    return users.filter((u) => u.sector === user.sector && u.id !== userId);
  }

  if (isUserResponsavel(userId)) {
    // Responsável: peers = other responsáveis of sibling sectors
    const sector = sectorByName.get(user.sector);
    if (!sector?.parentSector) return [];

    const siblings = childSectors.get(sector.parentSector) || [];
    const peers: UserData[] = [];

    for (const siblingName of siblings) {
      if (ISOLATED_SECTORS.has(siblingName)) continue;
      const sib = sectorByName.get(siblingName);
      if (sib) {
        const resp = usersByName.get(sib.responsavelName);
        if (resp && resp.id !== userId) {
          peers.push(resp);
        }
      }
    }

    return peers;
  } else {
    // Non-responsável: peers = other non-responsável people in the same sector
    return users.filter(
      (u) => u.sector === user.sector && u.id !== userId && !isUserResponsavel(u.id)
    );
  }
}

/** Get sector depth from root (Seazone=0, Holding=1, etc.) */
export function getSectorDepth(sectorName: string): number {
  let depth = 0;
  let current = sectorByName.get(sectorName);
  while (current?.parentSector) {
    depth++;
    current = sectorByName.get(current.parentSector);
  }
  return depth;
}

/** Derive role from org hierarchy */
export function deriveRole(userData: UserData): Role {
  const managedSectors = responsavelSectors.get(userData.name) || [];
  const isResponsavel = managedSectors.length > 0;

  // People sector responsável = RH
  if (isResponsavel && managedSectors.includes("People")) return "rh";

  // Root or Holding responsável = C-Level
  const sectorDepth = getSectorDepth(userData.sector);
  if (isResponsavel && sectorDepth <= 1) return "c_level";

  // Direct child of Holding responsável = Diretor
  if (isResponsavel && sectorDepth === 2) return "diretor";

  // Other responsável = Coordenador
  if (isResponsavel) return "coordenador";

  // Everyone else = Colaborador
  return "colaborador";
}

/** Convert UserData to full User (with derived fields) */
export function toUser(userData: UserData): User {
  const role = deriveRole(userData);
  const manager = getManager(userData.id);
  const sector = sectorByName.get(userData.sector);

  return {
    id: userData.id,
    name: userData.name,
    email: (userData as any).email || `${userData.id}@seazone.com`,
    role,
    department: sector?.parentSector || userData.sector,
    sector: userData.sector,
    cargo: userData.cargo,
    photoUrl: userData.photoUrl,
    slackUrl: userData.slackUrl,
    managerId: manager?.id || null,
  };
}

/** Get all users as full User objects */
export function getAllUsers(): User[] {
  return users.map(toUser);
}

/** Find user by ID */
export function findUser(userId: string): User | null {
  const data = userById.get(userId);
  return data ? toUser(data) : null;
}

/** Find user by name (exact match) */
export function findUserByName(name: string): User | null {
  const data = usersByName.get(name);
  return data ? toUser(data) : null;
}

/** Search users by name (partial, case-insensitive) */
export function searchUsers(query: string): User[] {
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return users
    .filter((u) => {
      const n = u.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return n.includes(q);
    })
    .map(toUser);
}
