/**
 * Sync medals from Google Sheets → src/data/medals.ts
 *
 * Can be run manually: node scripts/sync-medals.mjs
 * Or via API: /api/sync-medals (for cron/scheduled runs)
 */

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SHEET_ID = "1tolIf1eKRMLyYIWwWjB8D3-82YkK1uOPOGmlZXzDfNs";
const GID = "647381004";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

const validHabilidades = new Set([
  "Sangue no olho", "Colaboração", "Entrega de valor", "Atitude de dono",
  "Adaptabilidade", "Comunicação", "Consistência", "Pensar fora da caixa",
  "Prioriza e simplifica", "Organização", "Foco em fatos e dados",
]);

function cleanHabilidade(hab) {
  if (!hab) return "";
  return hab.replace(/\s*:[a-z-]+:\s*/g, "").trim();
}

function slugify(name) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function emailToName(email) {
  if (!email) return "";
  const local = email.split("@")[0];
  return local.split(".").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

// Robust CSV parser that handles multiline quoted fields
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

export async function syncMedals() {
  console.log("Fetching medals from Google Sheets...");

  const response = await fetch(CSV_URL, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  const lines = parseCSV(text);

  if (lines.length < 2) {
    throw new Error("CSV has no data rows");
  }

  const header = parseCSVLine(lines[0]);
  console.log("Header:", header.slice(0, 7));
  console.log("Total rows:", lines.length - 1);

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

  console.log(`Medals accepted: ${medals.length}, Skipped: ${skipped}`);
  return medals;
}

// CLI mode
if (process.argv[1] && process.argv[1].includes("sync-medals")) {
  const medals = await syncMedals();

  const ts = `// Auto-generated from Google Sheets — DO NOT EDIT MANUALLY
// Last sync: ${new Date().toISOString()}
// Source: https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?gid=${GID}
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

  const outPath = resolve(__dirname, "..", "src", "data", "medals.ts");
  writeFileSync(outPath, ts);
  console.log(`Written ${medals.length} medals to src/data/medals.ts`);
}
