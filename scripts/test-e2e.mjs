/**
 * E2E Test Script — Simula fluxo completo da IAVD via Supabase
 *
 * Testa: autoavaliação, avaliação gestor, par, liderado,
 * visualização de notas, resultados, e liberação de notas.
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

// Test users (from org data)
const GESTOR = "mario-lopes-de-andrade"; // C-Level / gestor do RH
const COLABORADOR = "lara-campideli-santos"; // Pessoa do time People
const PAR = "isabela-cenzi-portugal"; // Par da Lara

// 13 questions
const QUESTIONS = [
  "c1_sangue", "c2_atitude_dono", "c3_fatos_dados", "c4_priorize",
  "c5_escopo", "c6_entregas", "c7_consistencia", "c8_fora_caixa",
  "c9_organizacao", "c10_adaptabilidade", "c11_comunicacao", "c12_colaboracao", "c13_ia"
];

function createAnswers(score = 3, justification = "") {
  return QUESTIONS.map(qId => ({
    questionId: qId,
    score,
    justification: justification || (score !== 3
      ? "Exemplo concreto de teste: No projeto X em janeiro, a pessoa demonstrou este comportamento de forma clara e consistente durante 6 meses, gerando impacto mensurável no time e na empresa."
      : ""),
    chatHistory: [],
    aiValidated: false,
    contestation: undefined,
    aiReasoning: undefined,
  }));
}

let passed = 0;
let failed = 0;
const errors = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    errors.push(message);
    console.log(`  ✗ ${message}`);
  }
}

async function cleanup() {
  console.log("\n🧹 Limpando dados...");
  await supabase.from("evaluations").delete().neq("id", "0");
  await supabase.from("app_settings").upsert({ key: "notes_released", value: "false", updated_at: new Date().toISOString() });
  const { data } = await supabase.from("evaluations").select("id");
  assert(data.length === 0, "Banco limpo — 0 avaliações");
}

async function testAutoavaliacao() {
  console.log("\n📝 TESTE 1: Autoavaliação (colaborador se avalia)");

  const evalId = `test_auto_${Date.now()}`;
  const evaluation = {
    id: evalId,
    employee_id: COLABORADOR,
    evaluator_id: COLABORADOR,
    evaluation_type: "auto",
    status: "em_andamento",
    date: new Date().toISOString().split("T")[0],
    answers: createAnswers(null, ""),
    updated_at: new Date().toISOString(),
  };

  // Criar avaliação
  const { error: createErr } = await supabase.from("evaluations").insert(evaluation);
  assert(!createErr, `Criar autoavaliação: ${createErr?.message || "OK"}`);

  // Verificar que foi criada
  const { data: created } = await supabase.from("evaluations").select("*").eq("id", evalId).single();
  assert(created !== null, "Avaliação existe no banco");
  assert(created?.evaluation_type === "auto", "Tipo é 'auto'");
  assert(created?.status === "em_andamento", "Status é 'em_andamento'");
  assert(created?.answers?.length === 13, `Tem ${created?.answers?.length} respostas (esperado: 13)`);

  // Preencher com notas (maioria 3, uma 4 e uma 2)
  const filledAnswers = createAnswers(3);
  filledAnswers[0].score = 4; // Sangue no Olho = 4
  filledAnswers[0].justification = "No projeto de migração em janeiro, mantive foco e determinação por 3 semanas sem desistir, resolvendo bloqueios técnicos sozinha e entregando antes do prazo. Meu gestor reconheceu isso no 1:1.";
  filledAnswers[12].score = 2; // IA = 2
  filledAnswers[12].justification = "Uso IA esporadicamente, apenas quando alguém sugere. Não faz parte do meu fluxo diário ainda. Preciso melhorar nesse aspecto.";

  const { error: updateErr } = await supabase.from("evaluations").update({
    answers: filledAnswers,
    updated_at: new Date().toISOString(),
  }).eq("id", evalId);
  assert(!updateErr, `Atualizar respostas: ${updateErr?.message || "OK"}`);

  // Concluir avaliação
  const { error: concludeErr } = await supabase.from("evaluations").update({
    status: "concluida",
    answers: filledAnswers,
    updated_at: new Date().toISOString(),
  }).eq("id", evalId);
  assert(!concludeErr, `Concluir avaliação: ${concludeErr?.message || "OK"}`);

  const { data: concluded } = await supabase.from("evaluations").select("status").eq("id", evalId).single();
  assert(concluded?.status === "concluida", "Status final é 'concluida'");

  return evalId;
}

async function testAvaliacaoGestor() {
  console.log("\n👔 TESTE 2: Avaliação de Gestor (gestor avalia liderado)");

  const evalId = `test_gestor_${Date.now()}`;
  const evaluation = {
    id: evalId,
    employee_id: COLABORADOR,
    evaluator_id: GESTOR,
    evaluation_type: "gestor",
    status: "em_andamento",
    date: new Date().toISOString().split("T")[0],
    answers: createAnswers(null, ""),
    updated_at: new Date().toISOString(),
  };

  const { error: createErr } = await supabase.from("evaluations").insert(evaluation);
  assert(!createErr, `Criar avaliação gestor: ${createErr?.message || "OK"}`);

  // Preencher todas com nota 3
  const answers = createAnswers(3);

  const { error: updateErr } = await supabase.from("evaluations").update({
    status: "concluida",
    answers,
    updated_at: new Date().toISOString(),
  }).eq("id", evalId);
  assert(!updateErr, `Concluir avaliação gestor: ${updateErr?.message || "OK"}`);

  // Verificar que é visível como gestor avaliando colaborador
  const { data: gestorEvals } = await supabase.from("evaluations")
    .select("*")
    .eq("evaluator_id", GESTOR)
    .eq("employee_id", COLABORADOR)
    .eq("evaluation_type", "gestor");
  assert(gestorEvals?.length === 1, `Gestor tem 1 avaliação do colaborador`);
  assert(gestorEvals?.[0]?.status === "concluida", "Avaliação gestor concluída");

  return evalId;
}

async function testAvaliacaoPar() {
  console.log("\n🤝 TESTE 3: Avaliação de Par");

  const evalId = `test_par_${Date.now()}`;
  const evaluation = {
    id: evalId,
    employee_id: COLABORADOR,
    evaluator_id: PAR,
    evaluation_type: "par",
    status: "em_andamento",
    date: new Date().toISOString().split("T")[0],
    answers: createAnswers(null, ""),
    updated_at: new Date().toISOString(),
  };

  const { error: createErr } = await supabase.from("evaluations").insert(evaluation);
  assert(!createErr, `Criar avaliação par: ${createErr?.message || "OK"}`);

  const answers = createAnswers(3);
  answers[3].score = 4;
  answers[3].justification = "Nos projetos compartilhados, ela sempre prioriza o que importa e simplifica processos. No Q4, sugeriu uma mudança no fluxo de aprovação que economizou 2h por semana para o time inteiro.";

  const { error: updateErr } = await supabase.from("evaluations").update({
    status: "concluida",
    answers,
    updated_at: new Date().toISOString(),
  }).eq("id", evalId);
  assert(!updateErr, `Concluir avaliação par: ${updateErr?.message || "OK"}`);

  return evalId;
}

async function testAvaliacaoLiderado() {
  console.log("\n⬆️ TESTE 4: Avaliação de Liderado (liderado avalia gestor)");

  const evalId = `test_liderado_${Date.now()}`;
  const evaluation = {
    id: evalId,
    employee_id: GESTOR,
    evaluator_id: COLABORADOR,
    evaluation_type: "liderado",
    status: "em_andamento",
    date: new Date().toISOString().split("T")[0],
    answers: createAnswers(null, ""),
    updated_at: new Date().toISOString(),
  };

  const { error: createErr } = await supabase.from("evaluations").insert(evaluation);
  assert(!createErr, `Criar avaliação liderado: ${createErr?.message || "OK"}`);

  const answers = createAnswers(3);

  const { error: updateErr } = await supabase.from("evaluations").update({
    status: "concluida",
    answers,
    updated_at: new Date().toISOString(),
  }).eq("id", evalId);
  assert(!updateErr, `Concluir avaliação liderado: ${updateErr?.message || "OK"}`);

  return evalId;
}

async function testConsultasFiltradas() {
  console.log("\n🔍 TESTE 5: Queries filtradas");

  // fetchEvaluationsByEvaluator
  const { data: byEvaluator } = await supabase.from("evaluations")
    .select("*").eq("evaluator_id", COLABORADOR);
  assert(byEvaluator?.length === 2, `Colaborador fez ${byEvaluator?.length} avaliações (esperado: 2 — auto + liderado)`);

  // fetchEvaluationsByEmployee (gestor type)
  const { data: byEmployee } = await supabase.from("evaluations")
    .select("*").eq("employee_id", COLABORADOR).eq("evaluation_type", "gestor");
  assert(byEmployee?.length === 1, `Colaborador tem ${byEmployee?.length} avaliação gestor recebida (esperado: 1)`);

  // fetchEvaluationsByType
  const { data: byType } = await supabase.from("evaluations")
    .select("*").eq("evaluation_type", "par");
  assert(byType?.length === 1, `${byType?.length} avaliação(ões) de par no total (esperado: 1)`);

  // Todas
  const { data: all } = await supabase.from("evaluations").select("id");
  assert(all?.length === 4, `Total de ${all?.length} avaliações (esperado: 4)`);
}

async function testNotasNaoLiberadas() {
  console.log("\n🔒 TESTE 6: Notas não liberadas");

  const { data } = await supabase.from("app_settings")
    .select("value").eq("key", "notes_released").single();
  assert(data?.value === "false", "Notas estão bloqueadas (notes_released = false)");
}

async function testLiberarNotas() {
  console.log("\n🔓 TESTE 7: Liberar notas (RH)");

  const { error } = await supabase.from("app_settings").upsert({
    key: "notes_released",
    value: "true",
    updated_at: new Date().toISOString(),
  });
  assert(!error, `Liberar notas: ${error?.message || "OK"}`);

  const { data } = await supabase.from("app_settings")
    .select("value").eq("key", "notes_released").single();
  assert(data?.value === "true", "Notas liberadas (notes_released = true)");
}

async function testMinhasNotas() {
  console.log("\n📊 TESTE 8: Minhas Notas (colaborador vê suas notas)");

  // Simula o que o frontend faz: busca avaliações gestor do colaborador
  const { data: gestorEvals } = await supabase.from("evaluations")
    .select("*")
    .eq("employee_id", COLABORADOR)
    .eq("evaluation_type", "gestor")
    .neq("status", "em_andamento");

  assert(gestorEvals?.length === 1, `Colaborador vê ${gestorEvals?.length} avaliação gestor (esperado: 1)`);

  if (gestorEvals?.[0]) {
    const eval_ = gestorEvals[0];
    const scores = eval_.answers
      .map(a => a.score)
      .filter(s => s !== null);
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    assert(scores.length === 13, `Todas as 13 perguntas têm nota`);
    assert(avg >= 1 && avg <= 5, `Média é ${avg.toFixed(1)} (entre 1 e 5)`);

    // Verifica se calibration é null/undefined (calibração foi removida)
    assert(!eval_.calibration, "Sem dados de calibração (feature removida)");
  }
}

async function testResultados() {
  console.log("\n📈 TESTE 9: Resultados (RH vê tudo)");

  const { data: allEvals } = await supabase.from("evaluations")
    .select("*")
    .order("date", { ascending: false });

  assert(allEvals?.length === 4, `RH vê ${allEvals?.length} avaliações (esperado: 4)`);

  // Verificar que todos os tipos estão presentes
  const types = [...new Set(allEvals.map(e => e.evaluation_type))];
  assert(types.includes("auto"), "Tipo 'auto' presente");
  assert(types.includes("gestor"), "Tipo 'gestor' presente");
  assert(types.includes("par"), "Tipo 'par' presente");
  assert(types.includes("liderado"), "Tipo 'liderado' presente");

  // Verificar que todas estão concluídas
  const allConcluded = allEvals.every(e => e.status === "concluida");
  assert(allConcluded, "Todas as avaliações estão concluídas");
}

async function testEdgeCases() {
  console.log("\n⚠️ TESTE 10: Edge cases");

  // Tentar criar avaliação duplicada (mesmo avaliador, avaliado, tipo)
  const { error: dupErr } = await supabase.from("evaluations").insert({
    id: `test_dup_${Date.now()}`,
    employee_id: COLABORADOR,
    evaluator_id: COLABORADOR,
    evaluation_type: "auto",
    status: "em_andamento",
    date: new Date().toISOString().split("T")[0],
    answers: createAnswers(null, ""),
    updated_at: new Date().toISOString(),
  });
  // Supabase permite duplicatas (sem constraint unique) — verificar se front lida
  assert(!dupErr, "Banco aceita avaliação duplicada (front deve tratar)");

  // Limpar a duplicata
  const { data: dups } = await supabase.from("evaluations")
    .select("id").eq("evaluator_id", COLABORADOR).eq("employee_id", COLABORADOR).eq("evaluation_type", "auto");
  if (dups && dups.length > 1) {
    await supabase.from("evaluations").delete().eq("id", dups[1].id);
  }

  // Avaliação com 0 perguntas respondidas
  const emptyId = `test_empty_${Date.now()}`;
  await supabase.from("evaluations").insert({
    id: emptyId,
    employee_id: "test-nobody",
    evaluator_id: "test-nobody",
    evaluation_type: "auto",
    status: "em_andamento",
    date: new Date().toISOString().split("T")[0],
    answers: [],
    updated_at: new Date().toISOString(),
  });
  const { data: emptyEval } = await supabase.from("evaluations").select("answers").eq("id", emptyId).single();
  assert(emptyEval?.answers?.length === 0, "Avaliação com 0 answers criada (possível edge case no front)");
  await supabase.from("evaluations").delete().eq("id", emptyId);

  // Peer assignments existem
  const { data: peers } = await supabase.from("peer_assignments").select("id").limit(5);
  assert(peers && peers.length > 0, `Peer assignments existem (${peers?.length}+ registros)`);
}

async function testChatAPI() {
  console.log("\n🤖 TESTE 11: API de Chat (fallback rule-based)");

  const baseUrl = "https://seazone-avd-insight-lemon.vercel.app";

  // Test discuss mode
  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: {
          title: "Sangue no Olho",
          description: "Resiliência e determinação",
          category: "Sangue no Olho",
          scale: [{ score: 3, label: "Dentro do esperado", description: "Enfrenta obstáculos", examples: ["Persiste"] }],
        },
        employeeName: "Teste",
        justification: "Sempre demonstra muita garra",
        chatHistory: [],
        mode: "discuss",
        evaluationType: "gestor",
      }),
    });

    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("text/event-stream")) {
      // Streaming response — read it
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let content = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.done) content = event.content;
              else if (event.delta) content += event.delta;
            } catch {}
          }
        }
      }
      assert(content.length > 0, `Chat discuss: resposta streaming com ${content.length} chars`);
    } else {
      const data = await res.json();
      assert(data.content && data.content.length > 10, `Chat discuss: resposta com ${data.content?.length} chars`);
    }
    assert(res.status === 200, `Chat API status: ${res.status}`);
  } catch (err) {
    assert(false, `Chat API erro: ${err.message}`);
  }

  // Test help chat
  try {
    const res = await fetch(`${baseUrl}/api/chat-help`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Quem me avalia?",
        chatHistory: [{ role: "user", content: "Quem me avalia?" }],
        userName: "Teste",
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.content, `Chat help funciona: "${data.content?.substring(0, 50)}..."`);
  } catch (err) {
    assert(false, `Chat help erro: ${err.message}`);
  }
}

// ── Run all tests ──

async function main() {
  console.log("🚀 IAVD E2E Test Suite\n" + "=".repeat(50));

  await cleanup();
  await testAutoavaliacao();
  await testAvaliacaoGestor();
  await testAvaliacaoPar();
  await testAvaliacaoLiderado();
  await testConsultasFiltradas();
  await testNotasNaoLiberadas();
  await testLiberarNotas();
  await testMinhasNotas();
  await testResultados();
  await testEdgeCases();
  await testChatAPI();

  console.log("\n" + "=".repeat(50));
  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  if (errors.length > 0) {
    console.log(`\nErros:`);
    errors.forEach(e => console.log(`  - ${e}`));
  }
  console.log("");
}

main().catch(console.error);
