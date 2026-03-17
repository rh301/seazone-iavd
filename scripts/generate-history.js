const fs = require("fs");
const os = require("os");
const path = require("path");

const csvPath = path.join(
  os.homedir(),
  "Downloads",
  "SZN _ AVD _ Compilado_Novo - BD_Análises.csv"
);

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === "," && !inQ) {
      result.push(current.trim());
      current = "";
    } else current += ch;
  }
  result.push(current.trim());
  return result;
}

function slugify(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const text = fs.readFileSync(csvPath, "utf-8");
const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
const header = parseCSVLine(lines[0]);

const criteria = [
  "Adaptabilidade",
  "Atitude de Dono",
  "Colaboração",
  "Comunicação",
  "Consistência",
  "Entregas de Valor",
  "Escopo da Função",
  "Foco em Fatos e Dados",
  "Sangue nos olhos",
  "Priorize e Simplifique",
  "Pensar Fora da Caixa",
  "Organização",
];

const records = [];
for (let i = 1; i < lines.length; i++) {
  const r = parseCSVLine(lines[i]);
  const obj = {};
  header.forEach((h, idx) => {
    if (h) obj[h] = r[idx] || "";
  });

  if (!obj["Avaliado"]) continue;

  const scores = {};
  for (const c of criteria) {
    const v = parseInt(obj[c]);
    if (!isNaN(v)) scores[c] = v;
  }

  records.push({
    evaluatorName: obj["Avaliador"],
    evaluatorId: slugify(obj["Avaliador"]),
    employeeName: obj["Avaliado"],
    employeeId: slugify(obj["Avaliado"]),
    scores,
    notaFinal: parseInt(obj["Nota final"]) || null,
    conceito: obj["Conceito final"] || obj["Conceito"] || "",
    setor: obj["Setor"],
    area: obj["area"],
    cargo: obj["Cargo Atual"],
    gestor: obj["Gestor"],
  });
}

// Generate TypeScript file
const ts = `// Auto-generated from AVD history CSV — DO NOT EDIT
export interface HistoryRecord {
  evaluatorName: string;
  evaluatorId: string;
  employeeName: string;
  employeeId: string;
  scores: Record<string, number>;
  notaFinal: number | null;
  conceito: string;
  setor: string;
  area: string;
  cargo: string;
  gestor: string;
}

export const historyCriteria = ${JSON.stringify(criteria)};

export const cicloAnterior = "2025.1";

export const historyRecords: HistoryRecord[] = ${JSON.stringify(records, null, 2)};
`;

const outPath = path.join(__dirname, "..", "src", "data", "history.ts");
fs.writeFileSync(outPath, ts);
console.log(`Gerado: src/data/history.ts (${records.length} registros)`);

