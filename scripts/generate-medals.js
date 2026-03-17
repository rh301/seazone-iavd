const fs = require("fs");
const os = require("os");
const path = require("path");

const csvPath = path.join(os.tmpdir(), "medalhas.csv");
const text = fs.readFileSync(csvPath, "utf-8");

// Robust CSV parser that handles multiline fields
function parseCSV(text) {
  const records = [];
  let current = "";
  let inQuotes = false;
  const chars = text.replace(/\r/g, "");

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (ch === "\n" && !inQuotes) {
      if (current.trim()) records.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) records.push(current);
  return records;
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === "," && !inQ) { result.push(current.trim()); current = ""; }
    else current += ch;
  }
  result.push(current.trim());
  return result;
}

function slugify(name) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Email to name mapping - extract from email
function emailToName(email) {
  if (!email) return "";
  const local = email.split("@")[0];
  return local.split(".").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

const lines = parseCSV(text);
const header = parseCSVLine(lines[0]);
console.log("Header:", header);
console.log("Total lines:", lines.length - 1);

// Clean habilidade names
function cleanHabilidade(hab) {
  if (!hab) return "";
  return hab.replace(/\s*:[a-z-]+:\s*/g, "").trim();
}

const validHabilidades = new Set([
  "Sangue no olho", "Colaboração", "Entrega de valor", "Atitude de dono",
  "Adaptabilidade", "Comunicação", "Consistência", "Pensar fora da caixa",
  "Prioriza e simplifica", "Organização", "Foco em fatos e dados",
]);

const medals = [];
let skipped = 0;

for (let i = 1; i < lines.length; i++) {
  const r = parseCSVLine(lines[i]);
  const email = (r[0] || "").trim();
  const habilidade = cleanHabilidade(r[1] || "");
  const justificativa = (r[2] || "").trim();
  const quemEnviou = (r[3] || "").trim();
  const data = (r[5] || "").trim();
  const status = (r[6] || "").trim();

  if (!email || !validHabilidades.has(habilidade)) { skipped++; continue; }
  if (status !== "Aceitar") { skipped++; continue; }

  const name = emailToName(email);

  medals.push({
    employeeEmail: email,
    employeeName: name,
    employeeId: slugify(name),
    habilidade,
    justificativa: justificativa.substring(0, 500),
    quemEnviou,
    data,
  });
}

console.log("Medals accepted:", medals.length);
console.log("Skipped:", skipped);

// Group by person to verify
const byPerson = {};
medals.forEach(m => { byPerson[m.employeeName] = (byPerson[m.employeeName] || 0) + 1; });
console.log("Unique people:", Object.keys(byPerson).length);
console.log("Top 5:", Object.entries(byPerson).sort((a,b) => b[1]-a[1]).slice(0,5));

const ts = `// Auto-generated from medals CSV — DO NOT EDIT
export interface Medal {
  employeeEmail: string;
  employeeName: string;
  employeeId: string;
  habilidade: string;
  justificativa: string;
  quemEnviou: string;
  data: string;
}

export const medals: Medal[] = ${JSON.stringify(medals, null, 2)};
`;

const outPath = path.join(__dirname, "..", "src", "data", "medals.ts");
fs.writeFileSync(outPath, ts);
console.log("Gerado: src/data/medals.ts");
