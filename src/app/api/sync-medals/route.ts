import { NextResponse } from "next/server";

const SHEET_ID = "1tolIf1eKRMLyYIWwWjB8D3-82YkK1uOPOGmlZXzDfNs";
const GID = "647381004";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

const validHabilidades = new Set([
  "Sangue no olho", "Colaboração", "Entrega de valor", "Atitude de dono",
  "Adaptabilidade", "Comunicação", "Consistência", "Pensar fora da caixa",
  "Prioriza e simplifica", "Organização", "Foco em fatos e dados",
]);

function cleanHabilidade(hab: string) {
  return hab.replace(/\s*:[a-z-]+:\s*/g, "").trim();
}

function slugify(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function emailToName(email: string) {
  const local = email.split("@")[0];
  return local.split(".").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

function parseCSV(text: string) {
  const records: string[] = [];
  let current = "";
  let inQuotes = false;
  const chars = text.replace(/\r/g, "");
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === '"') { inQuotes = !inQuotes; current += ch; }
    else if (ch === "\n" && !inQuotes) { if (current.trim()) records.push(current); current = ""; }
    else current += ch;
  }
  if (current.trim()) records.push(current);
  return records;
}

function parseCSVLine(line: string) {
  const result: string[] = [];
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

export async function GET() {
  try {
    const response = await fetch(CSV_URL, { redirect: "follow" });
    if (!response.ok) {
      return NextResponse.json({ error: `Sheet fetch failed: ${response.status}` }, { status: 500 });
    }

    const text = await response.text();
    const lines = parseCSV(text);
    if (lines.length < 2) {
      return NextResponse.json({ error: "No data rows" }, { status: 500 });
    }

    const medals: Array<{
      employeeEmail: string;
      employeeName: string;
      employeeId: string;
      habilidade: string;
      justificativa: string;
      quemEnviou: string;
      data: string;
    }> = [];

    for (let i = 1; i < lines.length; i++) {
      const r = parseCSVLine(lines[i]);
      const email = (r[0] || "").trim();
      const habilidade = cleanHabilidade(r[1] || "");
      const justificativa = (r[2] || "").trim();
      const quemEnviou = (r[3] || "").trim();
      const data = (r[5] || "").trim();
      const status = (r[6] || "").trim();

      if (!email || !validHabilidades.has(habilidade)) continue;
      if (status !== "Aceitar") continue;

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

    return NextResponse.json({
      medals,
      count: medals.length,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
