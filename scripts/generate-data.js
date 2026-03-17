const fs = require("fs");
const path = require("path");
const os = require("os");

const tmpDir = os.tmpdir();
const orgPath = path.join(tmpDir, "organograma.csv");
const pplPath = path.join(tmpDir, "pessoas.csv");

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else current += ch;
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text) {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  const header = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const vals = parseCSVLine(line);
    const obj = {};
    header.forEach((h, i) => (obj[h] = (vals[i] || "").trim()));
    return obj;
  });
}

function slugify(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Read CSVs
const orgData = parseCSV(fs.readFileSync(orgPath, "utf-8"));
const pplData = parseCSV(fs.readFileSync(pplPath, "utf-8"));

console.log(`Organograma: ${orgData.length} setores`);
console.log(`Pessoas: ${pplData.length} colaboradores`);

// Generate sectors.ts
const sectorsTS = `// Auto-generated from organograma.csv — DO NOT EDIT
export interface Sector {
  name: string;
  parentSector: string | null;
  responsavelName: string;
}

export const sectors: Sector[] = ${JSON.stringify(
  orgData.map((row) => ({
    name: row["Setor"],
    parentSector: row["Setor Pai"] || null,
    responsavelName: row["Responsável"] || row["Responsavel"] || "",
  })),
  null,
  2
)};
`;

// Generate users.ts
const usersTS = `// Auto-generated from pessoas.csv — DO NOT EDIT
export interface UserData {
  id: string;
  name: string;
  sector: string;
  cargo: string;
  slackUrl: string | null;
  photoUrl: string | null;
}

export const users: UserData[] = ${JSON.stringify(
  pplData.map((row) => ({
    id: slugify(row["Nome"]),
    name: row["Nome"],
    sector: row["Setor"],
    cargo: row["Cargo"] || "",
    slackUrl: row["Link Slack"] || null,
    photoUrl: row["Foto"] || null,
  })),
  null,
  2
)};
`;

// Validate: all responsaveis exist in users (warn but don't fail)
const nameSet = new Set(pplData.map((p) => p["Nome"]));
const missing = orgData.filter(
  (o) => !nameSet.has(o["Responsável"] || o["Responsavel"] || "")
);
if (missing.length) {
  console.warn("AVISO: Responsáveis ausentes em pessoas.csv (setores ignorados):");
  missing.forEach((m) => console.warn(`  - ${m["Responsável"]} (${m["Setor"]})`));
}

// Check duplicate IDs
const ids = pplData.map((p) => slugify(p["Nome"]));
const dupeIds = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupeIds.length) {
  console.error("ERRO: IDs duplicados:", [...new Set(dupeIds)]);
  process.exit(1);
}

// Write files
const dataDir = path.join(__dirname, "..", "src", "data");
fs.writeFileSync(path.join(dataDir, "sectors.ts"), sectorsTS);
fs.writeFileSync(path.join(dataDir, "users.ts"), usersTS);

console.log(`\nGerados:`);
console.log(`  src/data/sectors.ts (${orgData.length} setores)`);
console.log(`  src/data/users.ts (${pplData.length} usuários)`);
