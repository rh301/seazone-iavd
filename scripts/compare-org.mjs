import { readFileSync } from "fs";
import { resolve } from "path";

const orgRaw = JSON.parse(readFileSync(resolve("C:/Users/compu/organograma-seazone-app/src/data/employees.json"), "utf-8"));
const orgData = orgRaw.employees || orgRaw;
console.log("Org chart employees:", orgData.length);

// Load IAVD data
const usersContent = readFileSync(resolve("src/data/users.ts"), "utf-8");
const usersMatch = usersContent.match(/export const users.*?= (\[[\s\S]*?\]);/);
const users = JSON.parse(usersMatch[1]);

const sectorsContent = readFileSync(resolve("src/data/sectors.ts"), "utf-8");
const sectorsMatch = sectorsContent.match(/export const sectors.*?= (\[[\s\S]*?\]);/);
const sectors = JSON.parse(sectorsMatch[1]);

// Build sector -> responsavel map
const sectorResponsavel = {};
for (const s of sectors) {
  sectorResponsavel[s.name] = s.responsavelName;
}

// Build org chart lookup by full name
const orgByFullName = new Map();
for (const e of orgData) {
  const fullName = e.social_name || `${e.name} ${e.last_name || ""}`.trim();
  orgByFullName.set(fullName, e);
}

// Compare supervisors
const issues = [];
let matched = 0;

for (const u of users) {
  const orgEmp = orgByFullName.get(u.name);
  if (!orgEmp) continue;
  matched++;

  const orgSupervisor = orgEmp.supervisor;
  const iavdResponsavel = sectorResponsavel[u.sector];

  if (!orgSupervisor || !iavdResponsavel) continue;

  // Check if org supervisor matches IAVD sector responsavel
  const orgSupFirstName = orgSupervisor.split(" ")[0].toLowerCase();
  const iavdRespFirstName = iavdResponsavel.split(" ")[0].toLowerCase();

  if (orgSupFirstName !== iavdRespFirstName) {
    issues.push({
      person: u.name,
      sector: u.sector,
      iavdLeader: iavdResponsavel,
      orgSupervisor: orgSupervisor,
      department: orgEmp.department,
    });
  }
}

console.log(`IAVD users: ${users.length}`);
console.log(`Matched with org chart: ${matched}`);
console.log(`\nLiderança diferente entre IAVD e Organograma: ${issues.length}\n`);

// Group by IAVD sector
const bySector = {};
for (const i of issues) {
  if (!bySector[i.sector]) bySector[i.sector] = [];
  bySector[i.sector].push(i);
}

for (const [sector, people] of Object.entries(bySector).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`[${sector}] — IAVD diz: ${people[0].iavdLeader} | Org diz: ${people[0].orgSupervisor}`);
  for (const p of people) {
    console.log(`  - ${p.person} (org dept: ${p.department || "?"})`);
  }
  console.log("");
}
