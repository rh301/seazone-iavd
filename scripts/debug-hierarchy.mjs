import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const envContent = readFileSync("C:/Users/compu/projetos/projeto-iavd/.env.local", "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)="?([^"]*)"?/);
  if (match) env[match[1].trim()] = match[2].replace(/\\n$/, "").trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const { data } = await supabase.from("app_settings").select("value").eq("key", "manager_overrides").single();
const overrides = data ? JSON.parse(data.value) : {};

const usersContent = readFileSync("src/data/users.ts", "utf-8");
const usersMatch = usersContent.match(/export const users.*?= (\[[\s\S]*?\]);/);
const users = JSON.parse(usersMatch[1]);

const sectorsContent = readFileSync("src/data/sectors.ts", "utf-8");
const sectorsMatch = sectorsContent.match(/export const sectors.*?= (\[[\s\S]*?\]);/);
const sectors = JSON.parse(sectorsMatch[1]);

const userById = new Map(users.map(u => [u.id, u]));
const usersByName = new Map(users.map(u => [u.name, u]));
const sectorByName = new Map(sectors.map(s => [s.name, s]));

function getManager(userId) {
  if (overrides[userId]) {
    return userById.get(overrides[userId]) || null;
  }
  const user = userById.get(userId);
  if (!user) return null;
  const sector = sectorByName.get(user.sector);
  if (!sector) return null;
  const manager = usersByName.get(sector.responsavelName);
  if (!manager || manager.id === userId) {
    if (sector.parentSector) {
      const ps = sectorByName.get(sector.parentSector);
      if (ps) {
        const pm = usersByName.get(ps.responsavelName);
        if (pm && pm.id !== userId) return pm;
      }
    }
    return null;
  }
  return manager;
}

console.log("Overrides count:", Object.keys(overrides).length);

// Check: who reports to Fernando?
const fernando = users.find(u => u.name.includes("Fernando Silva"));
console.log("\nFernando:", fernando?.id, fernando?.name);

let roots = 0;
const childrenOf = {};
const orphans = [];

for (const u of users) {
  const mgr = getManager(u.id);
  if (!mgr) {
    roots++;
    if (u.id !== fernando?.id) orphans.push(u.name + " (" + u.sector + ")");
  } else {
    if (!childrenOf[mgr.id]) childrenOf[mgr.id] = [];
    childrenOf[mgr.id].push(u.name);
  }
}

console.log("\nRoots (no manager):", roots);
console.log("Fernando direct reports:", (childrenOf[fernando?.id] || []).length);
(childrenOf[fernando?.id] || []).forEach(n => console.log("  -", n));

console.log("\nOrphans (not Fernando, no manager):");
orphans.forEach(n => console.log("  -", n));

// Check if overrides point to valid users
let invalidOverrides = 0;
for (const [personId, managerId] of Object.entries(overrides)) {
  if (!userById.has(personId)) { invalidOverrides++; continue; }
  if (!userById.has(managerId)) {
    invalidOverrides++;
    const person = userById.get(personId);
    console.log("  Invalid override:", person?.name, "->", managerId, "(not found)");
  }
}
console.log("\nInvalid overrides:", invalidOverrides);
