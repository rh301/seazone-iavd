/**
 * Sincroniza o IAVD com o organograma (supervisores diretos).
 * Atualiza sectors.ts com os responsáveis corretos baseados no supervisor
 * direto de cada pessoa no organograma (employees.json).
 *
 * Também atualiza o manager_overrides no Supabase e regenera o results_access.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Load env
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)="?([^"]*)"?/);
  if (match) env[match[1].trim()] = match[2].replace(/\\n$/, "").trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Load org chart data
const orgRaw = JSON.parse(readFileSync(resolve("C:/Users/compu/organograma-seazone-app/src/data/employees.json"), "utf-8"));
const orgData = orgRaw.employees || orgRaw;

// Load IAVD data
const usersContent = readFileSync(resolve("src/data/users.ts"), "utf-8");
const usersMatch = usersContent.match(/export const users.*?= (\[[\s\S]*?\]);/);
const users = JSON.parse(usersMatch[1]);

const sectorsContent = readFileSync(resolve("src/data/sectors.ts"), "utf-8");
const sectorsMatch = sectorsContent.match(/export const sectors.*?= (\[[\s\S]*?\]);/);
const sectors = JSON.parse(sectorsMatch[1]);

// Build org chart lookup
const orgByFullName = new Map();
for (const e of orgData) {
  const fullName = e.social_name || `${e.name} ${e.last_name || ""}`.trim();
  orgByFullName.set(fullName, e);
}

// Build user lookup
const userByName = new Map();
const userById = new Map();
for (const u of users) {
  userByName.set(u.name, u);
  userById.set(u.id, u);
}

// Slugify
function slugify(name) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Robust supervisor name matching — org chart has short names like "Fernando Silva Pereira"
// IAVD has full names. Match by first name + last name, with normalization.
function norm(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function findUserByOrgName(orgName) {
  if (!orgName) return null;
  const orgNorm = norm(orgName);
  const orgParts = orgNorm.split(/\s+/);
  const orgFirst = orgParts[0];
  const orgLast = orgParts[orgParts.length - 1];

  // 1. Exact match
  for (const [name, data] of userByName) {
    if (norm(name) === orgNorm) return [name, data];
  }

  // 2. First + last name match
  const candidates = [];
  for (const [name, data] of userByName) {
    const parts = norm(name).split(/\s+/);
    const first = parts[0];
    const last = parts[parts.length - 1];
    if (first === orgFirst && last === orgLast) {
      candidates.push([name, data]);
    }
  }
  if (candidates.length === 1) return candidates[0];

  // 3. If multiple candidates by first+last, try matching more parts
  if (candidates.length > 1 && orgParts.length > 2) {
    const orgSecond = orgParts[1];
    const better = candidates.filter(([name]) => {
      const parts = norm(name).split(/\s+/);
      return parts.length > 1 && parts[1] === orgSecond;
    });
    if (better.length === 1) return better[0];
  }

  // 4. Fallback: first name only if unique
  const firstNameMatches = [...userByName.entries()].filter(([name]) =>
    norm(name).split(/\s+/)[0] === orgFirst
  );
  if (firstNameMatches.length === 1) return firstNameMatches[0];

  return null;
}

// For each sector, find who is really the supervisor in the org chart
// A sector's responsável should be the person that employees in that sector report to
console.log("📊 Analisando supervisores do organograma...\n");

// Build: for each dept, who do most people report to?
const deptSupervisorVotes = new Map(); // dept -> Map<supervisor, count>

for (const e of orgData) {
  if (!e.department || !e.supervisor) continue;
  const fullName = e.social_name || `${e.name} ${e.last_name || ""}`.trim();

  // Skip if this person IS the supervisor (they report to someone else)
  const votes = deptSupervisorVotes.get(e.department) || new Map();
  const count = votes.get(e.supervisor) || 0;
  votes.set(e.supervisor, count + 1);
  deptSupervisorVotes.set(e.department, votes);
}

// For each sector in IAVD, find the matching org chart supervisor
const sectorUpdates = [];
const managerOverrides = {};

for (const sector of sectors) {
  const votes = deptSupervisorVotes.get(sector.name);
  if (!votes) continue;

  // Get the most common supervisor for this dept
  let topSupervisor = null;
  let topCount = 0;
  for (const [sup, count] of votes) {
    if (count > topCount) {
      topSupervisor = sup;
      topCount = count;
    }
  }

  if (!topSupervisor) continue;

  const supResult = findUserByOrgName(topSupervisor);
  if (!supResult) continue;

  const [supFullName] = supResult;

  if (sector.responsavelName !== supFullName) {
    sectorUpdates.push({
      sector: sector.name,
      oldResponsavel: sector.responsavelName,
      newResponsavel: supFullName,
      votes: topCount,
    });
  }
}

console.log(`Setores a atualizar: ${sectorUpdates.length}\n`);
for (const u of sectorUpdates) {
  console.log(`  [${u.sector}] ${u.oldResponsavel} → ${u.newResponsavel} (${u.votes} votos)`);
}

// Also build per-person manager overrides for people whose direct supervisor
// differs from the sector responsável
console.log("\n📋 Calculando overrides de gestor individual...\n");

let overrideCount = 0;
for (const u of users) {
  const orgEmp = orgByFullName.get(u.name);
  if (!orgEmp || !orgEmp.supervisor) continue;

  // Find supervisor in IAVD users
  const supResult = findUserByOrgName(orgEmp.supervisor);
  if (!supResult) continue;
  const [supFullName, supData] = supResult;

  // Check the sector responsável after updates
  const sectorUpdate = sectorUpdates.find(su => su.sector === u.sector);
  const effectiveResponsavel = sectorUpdate ? sectorUpdate.newResponsavel : sectors.find(s => s.name === u.sector)?.responsavelName;

  // If the person's org supervisor differs from the sector responsável, add override
  if (effectiveResponsavel && supFullName !== effectiveResponsavel && supFullName !== u.name) {
    managerOverrides[u.id] = supData.id;
    overrideCount++;
  }
}

console.log(`Manager overrides: ${overrideCount}`);

// Apply sector updates to sectors.ts
const updatedSectors = sectors.map(s => {
  const update = sectorUpdates.find(u => u.sector === s.name);
  if (update) {
    return { ...s, responsavelName: update.newResponsavel };
  }
  return s;
});

const newSectorsTs = `// Auto-generated from organograma — synced ${new Date().toISOString().split("T")[0]}
export interface Sector {
  name: string;
  parentSector: string | null;
  responsavelName: string;
}

export const sectors: Sector[] = ${JSON.stringify(updatedSectors, null, 2)};
`;

writeFileSync(resolve("src/data/sectors.ts"), newSectorsTs);
console.log("\n✅ sectors.ts atualizado");

// Save manager overrides to Supabase
const { error: overrideError } = await supabase.from("app_settings").upsert({
  key: "manager_overrides",
  value: JSON.stringify(managerOverrides),
  updated_at: new Date().toISOString(),
});
if (overrideError) console.error("❌ Erro overrides:", overrideError);
else console.log(`✅ ${overrideCount} manager overrides salvos no Supabase`);

// Now regenerate results access based on updated org structure
console.log("\n🔄 Regenerando acesso a resultados...");

// Rebuild sector responsavel from updated data
const sectorResponsavel = {};
for (const s of updatedSectors) {
  sectorResponsavel[s.name] = s.responsavelName;
}

// Build children map
const childSectors = new Map();
for (const s of updatedSectors) {
  if (s.parentSector) {
    const children = childSectors.get(s.parentSector) || [];
    children.push(s.name);
    childSectors.set(s.parentSector, children);
  }
}

function getAllSubSectors(sectorName) {
  const result = [sectorName];
  const children = childSectors.get(sectorName) || [];
  for (const child of children) {
    result.push(...getAllSubSectors(child));
  }
  return result;
}

// Build access list from sector responsáveis
const responsavelSectors = new Map();
for (const s of updatedSectors) {
  const list = responsavelSectors.get(s.responsavelName) || [];
  list.push(s.name);
  responsavelSectors.set(s.responsavelName, list);
}

const accessList = {};
for (const [responsavelName, managedSectors] of responsavelSectors) {
  const responsavel = userByName.get(responsavelName);
  if (!responsavel) continue;

  const allSectors = new Set();
  for (const sector of managedSectors) {
    for (const sub of getAllSubSectors(sector)) {
      allSectors.add(sub);
    }
  }

  const sectorSet = new Set(allSectors);
  const people = users.filter(u => sectorSet.has(u.sector)).map(u => u.id);
  const visiblePeople = people.filter(id => id !== responsavel.id);

  if (visiblePeople.length > 0) {
    accessList[responsavel.id] = visiblePeople;
  }
}

// Also add manager overrides — people who are supervisors via override should see their reports
for (const [personId, managerId] of Object.entries(managerOverrides)) {
  if (!accessList[managerId]) {
    accessList[managerId] = [];
  }
  if (!accessList[managerId].includes(personId)) {
    accessList[managerId].push(personId);
  }
}

const { error: accessError } = await supabase.from("app_settings").upsert({
  key: "results_access",
  value: JSON.stringify({ accessList }),
  updated_at: new Date().toISOString(),
});
if (accessError) console.error("❌ Erro access:", accessError);
else console.log(`✅ Acesso a resultados atualizado (${Object.keys(accessList).length} líderes)`);

console.log("\n🎉 Sync completo!");
