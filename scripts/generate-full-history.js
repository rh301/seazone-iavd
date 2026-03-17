const fs = require("fs");
const os = require("os");
const path = require("path");

// Criteria names in order (cols 10-29 for auto, 31-50 for gestor)
const criteriaNames = [
  "Sangue no olho", "Produtividade", "Consistência", "Colaboração",
  "Comunicação", "Qualidade de trabalho", "Conhecimento técnico",
  "Objetividade", "Foco", "Metodologia", "Adaptabilidade",
  "Responsabilidade", "Organização", "Pensar fora da caixa",
  "Proatividade", "Dinamismo", "Resolução de problemas",
  "Multitasking", "Pensamento analítico", "Liderança",
];

const validPeriods = new Set([
  "1H2022", "1H2022*", "2H2022", "1H2023", "2H2023", "1H2024", "2H2024", "1H2025",
]);

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

// Read historical CSV
const histPath = path.join(os.homedir(), "Downloads", "Compilado Avaliação Semestral - BD_Completo Histórico.csv");
const histText = fs.readFileSync(histPath, "utf-8");
const histLines = histText.replace(/\r/g, "").split("\n").filter((l) => l.trim());

const histRecords = [];
for (let i = 1; i < histLines.length; i++) {
  const r = parseCSVLine(histLines[i]);
  const periodo = r[0];
  if (!validPeriods.has(periodo)) continue;

  const avaliado = r[5];
  if (!avaliado) continue;

  const autoScores = {};
  const gestorScores = {};
  for (let j = 0; j < 20; j++) {
    const autoVal = parseInt(r[10 + j]);
    const gestorVal = parseInt(r[31 + j]);
    if (!isNaN(autoVal) && autoVal >= 1 && autoVal <= 5) autoScores[criteriaNames[j]] = autoVal;
    if (!isNaN(gestorVal) && gestorVal >= 1 && gestorVal <= 5) gestorScores[criteriaNames[j]] = gestorVal;
  }

  histRecords.push({
    periodo: periodo.replace("*", ""),
    employeeName: avaliado,
    employeeId: slugify(avaliado),
    evaluatorName: r[6] || "",
    setor: r[7] || "",
    cargo: r[8] || "",
    autoScores,
    gestorScores,
    autoSoma: Object.values(autoScores).reduce((a, b) => a + b, 0),
    gestorSoma: Object.values(gestorScores).reduce((a, b) => a + b, 0),
  });
}

// Read current cycle CSV (BD_Análises)
const currPath = path.join(os.homedir(), "Downloads", "SZN _ AVD _ Compilado_Novo - BD_Análises.csv");
const currText = fs.readFileSync(currPath, "utf-8");
const currLines = currText.replace(/\r/g, "").split("\n").filter((l) => l.trim());
const currHeader = parseCSVLine(currLines[0]);

const currCriteria = [
  "Adaptabilidade", "Atitude de Dono", "Colaboração", "Comunicação",
  "Consistência", "Entregas de Valor", "Escopo da Função",
  "Foco em Fatos e Dados", "Sangue nos olhos", "Priorize e Simplifique",
  "Pensar Fora da Caixa", "Organização",
];

const currRecords = [];
for (let i = 1; i < currLines.length; i++) {
  const r = parseCSVLine(currLines[i]);
  const avaliado = r[2];
  if (!avaliado) continue;

  const scores = {};
  for (let j = 0; j < currCriteria.length; j++) {
    const v = parseInt(r[4 + j]);
    if (!isNaN(v) && v >= 1 && v <= 5) scores[currCriteria[j]] = v;
  }

  const cfIdx = currHeader.indexOf("Conceito final");

  currRecords.push({
    periodo: "1H2025",
    employeeName: avaliado,
    employeeId: slugify(avaliado),
    evaluatorName: r[1] || "",
    setor: r[currHeader.indexOf("Setor")] || "",
    cargo: r[currHeader.indexOf("Cargo Atual")] || "",
    scores,
    soma: Object.values(scores).reduce((a, b) => a + b, 0),
    conceito: r[cfIdx] || "",
  });
}

// Generate TS
const ts = `// Auto-generated from historical CSVs — DO NOT EDIT
export interface HistoryCycleRecord {
  periodo: string;
  employeeName: string;
  employeeId: string;
  evaluatorName: string;
  setor: string;
  cargo: string;
  autoScores: Record<string, number>;
  gestorScores: Record<string, number>;
  autoSoma: number;
  gestorSoma: number;
}

export interface CurrentCycleRecord {
  periodo: string;
  employeeName: string;
  employeeId: string;
  evaluatorName: string;
  setor: string;
  cargo: string;
  scores: Record<string, number>;
  soma: number;
  conceito: string;
}

export const allPeriods = ${JSON.stringify([...new Set(histRecords.map(r => r.periodo))].sort())};

export const historyCriteria = ${JSON.stringify(criteriaNames)};

export const currentCriteria = ${JSON.stringify(currCriteria)};

export const cicloAnterior = "1H2025";

export const historyRecords: HistoryCycleRecord[] = ${JSON.stringify(histRecords, null, 2)};

export const currentCycleRecords: CurrentCycleRecord[] = ${JSON.stringify(currRecords, null, 2)};
`;

const outPath = path.join(__dirname, "..", "src", "data", "history.ts");
fs.writeFileSync(outPath, ts);
console.log("Gerado: src/data/history.ts");
console.log("  Histórico: " + histRecords.length + " registros em " + new Set(histRecords.map(r => r.periodo)).size + " ciclos");
console.log("  Ciclo atual: " + currRecords.length + " registros");
