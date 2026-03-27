/**
 * Gera acesso a resultados baseado no organograma.
 * Cada responsável de setor vê as pessoas dos setores que gerencia.
 * Salva no Supabase app_settings.results_access
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load env
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)="?([^"]*)"?/);
  if (match) env[match[1].trim()] = match[2].replace(/\\n$/, "").trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Import data directly by reading and eval
const sectorsContent = readFileSync(resolve(process.cwd(), "src/data/sectors.ts"), "utf-8");
const usersContent = readFileSync(resolve(process.cwd(), "src/data/users.ts"), "utf-8");

// Parse sectors
const sectorsMatch = sectorsContent.match(/export const sectors.*?= (\[[\s\S]*?\]);/);
const sectors = JSON.parse(sectorsMatch[1].replace(/\n\s*/g, " "));

// Parse users
const usersMatch = usersContent.match(/export const users.*?= (\[[\s\S]*?\]);/);
const users = JSON.parse(usersMatch[1].replace(/\n\s*/g, " "));

// Build user lookup by name
const userByName = new Map();
for (const u of users) {
  userByName.set(u.name, u);
}

// Build sector children
const childSectors = new Map();
for (const s of sectors) {
  if (s.parentSector) {
    const children = childSectors.get(s.parentSector) || [];
    children.push(s.name);
    childSectors.set(s.parentSector, children);
  }
}

// Get all sectors under a given sector (recursive)
function getAllSubSectors(sectorName) {
  const result = [sectorName];
  const children = childSectors.get(sectorName) || [];
  for (const child of children) {
    result.push(...getAllSubSectors(child));
  }
  return result;
}

// Get all people in a set of sectors
function getPeopleInSectors(sectorNames) {
  const sectorSet = new Set(sectorNames);
  return users.filter(u => sectorSet.has(u.sector)).map(u => u.id);
}

// Build access list: for each unique responsável, find all people under their sectors
const responsavelSectors = new Map(); // name -> [sector names they manage]
for (const s of sectors) {
  const list = responsavelSectors.get(s.responsavelName) || [];
  list.push(s.name);
  responsavelSectors.set(s.responsavelName, list);
}

const accessList = {};
const leaderDetails = [];

for (const [responsavelName, managedSectors] of responsavelSectors) {
  const responsavel = userByName.get(responsavelName);
  if (!responsavel) {
    console.log(`⚠️  Responsável não encontrado: "${responsavelName}"`);
    continue;
  }

  // Get all sub-sectors (recursive) for all sectors this person manages
  const allSectors = new Set();
  for (const sector of managedSectors) {
    for (const sub of getAllSubSectors(sector)) {
      allSectors.add(sub);
    }
  }

  // Get all people in those sectors
  const people = getPeopleInSectors([...allSectors]);

  // Remove self from the list
  const visiblePeople = people.filter(id => id !== responsavel.id);

  if (visiblePeople.length > 0) {
    accessList[responsavel.id] = visiblePeople;
    leaderDetails.push({
      name: responsavel.name,
      id: responsavel.id,
      sectors: [...allSectors].length,
      people: visiblePeople.length,
      role: responsavel.cargo,
    });
  }
}

// Sort by number of people (desc)
leaderDetails.sort((a, b) => b.people - a.people);

console.log("\n📊 Acesso a Resultados gerado do organograma:\n");
console.log(`Total de líderes com acesso: ${leaderDetails.length}\n`);
console.log("Top 20:");
for (const l of leaderDetails.slice(0, 20)) {
  console.log(`  ${l.name.padEnd(45)} ${String(l.people).padStart(3)} pessoas  (${l.sectors} setores)  [${l.role}]`);
}
console.log(`  ... e mais ${Math.max(0, leaderDetails.length - 20)} líderes\n`);

// Save to Supabase
const { error } = await supabase.from("app_settings").upsert({
  key: "results_access",
  value: JSON.stringify({ accessList }),
  updated_at: new Date().toISOString(),
});

if (error) {
  console.error("❌ Erro ao salvar:", error);
} else {
  console.log("✅ Salvo no Supabase (app_settings.results_access)");
}
