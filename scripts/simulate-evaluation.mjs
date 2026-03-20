/**
 * Simula avaliação 360 completa para Lara Campideli Santos
 *
 * Avaliações criadas:
 * 1. Mario (gestor) avalia Lara
 * 2. Lara (auto) se avalia
 * 3. Isabela (par) avalia Lara
 * 4. Lara (liderado do Mario) avalia Mario — bonus para testar liderado
 */

const SUPABASE_URL = "https://xufjuoxurwvqwiamhrcf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Zmp1b3h1cnd2cXdpYW1ocmNmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc1ODQwMywiZXhwIjoyMDg5MzM0NDAzfQ.Ot1vw9uSr941cHUypBlp1gXhfkwLS7mAWtHguiJRls8";

const LARA_ID = "lara-campideli-santos";
const MARIO_ID = "mario-lopes-de-andrade";
const ISABELA_ID = "isabela-cenzi-portugal";

const questionIds = [
  "v1_q1", "v1_q2", // Sangue no Olho
  "v2_q1", "v2_q2", // Foco em Fatos e Dados
  "v3_q1", "v3_q2", // Priorize e Simplifique
  "v4_q1", "v4_q2", // Proatividade
  "v5_q1", "v5_q2", // AI First
];

function makeAnswer(questionId, score, justification = "") {
  return {
    questionId,
    score,
    justification,
    chatHistory: [],
    aiValidated: true,
    aiReasoning: "",
  };
}

const now = new Date().toISOString();

const evaluations = [
  // 1. Mario (gestor) avalia Lara — scores variados
  {
    id: `sim-gestor-lara-${Date.now()}`,
    employee_id: LARA_ID,
    evaluator_id: MARIO_ID,
    evaluation_type: "gestor",
    status: "concluida",
    date: now,
    answers: [
      makeAnswer("v1_q1", 4, "Lara é muito resiliente. Quando tivemos problemas com o sistema de avaliação, ela assumiu a frente e reorganizou todo o processo sem precisar que eu pedisse."),
      makeAnswer("v1_q2", 3, "Cumpre as metas definidas e comunica quando tem dificuldade."),
      makeAnswer("v2_q1", 4, "Sempre traz dados do People Analytics para embasar decisões. No último trimestre, usou dados de turnover para redesenhar o onboarding."),
      makeAnswer("v2_q2", 3, "Aceita feedback e ajusta quando trazemos dados. Postura construtiva."),
      makeAnswer("v3_q1", 3, "Organiza bem suas demandas. Negocia prazos quando necessário."),
      makeAnswer("v3_q2", 3, "Não complica as coisas, entrega soluções funcionais."),
      makeAnswer("v4_q1", 4, "Identificou que o processo de avaliação anterior tinha falhas antes de eu perceber. Propôs a mudança por conta própria."),
      makeAnswer("v4_q2", 3, "Contribui com sugestões em rituais do time. Participa ativamente."),
      makeAnswer("v5_q1", 3, "Usa IA regularmente para acelerar tarefas de People Analytics."),
      makeAnswer("v5_q2", 3, "Compartilha o que aprende com o time quando perguntam."),
    ],
    calibration: null,
  },

  // 2. Lara (auto) se avalia
  {
    id: `sim-auto-lara-${Date.now() + 1}`,
    employee_id: LARA_ID,
    evaluator_id: LARA_ID,
    evaluation_type: "auto",
    status: "concluida",
    date: now,
    answers: [
      makeAnswer("v1_q1", 4, "Quando o sistema de avaliação travou, eu assumi a responsabilidade e criei um plano alternativo no mesmo dia."),
      makeAnswer("v1_q2", 4, "Me comprometo muito com as metas. No último ciclo consegui entregar tudo mesmo com uma pessoa a menos no time."),
      makeAnswer("v2_q1", 4, "Sempre uso dados de People Analytics nas minhas propostas. Recentemente fiz uma análise de turnover que mudou a estratégia de retenção."),
      makeAnswer("v2_q2", 3, "Costumo reavaliar minhas posições quando trazem dados novos."),
      makeAnswer("v3_q1", 3, "Me organizo bem, priorizo por impacto."),
      makeAnswer("v3_q2", 3, "Busco sempre a solução mais simples."),
      makeAnswer("v4_q1", 4, "Costumo perceber problemas antes de virarem crises. Sinalizei o risco do turnover no setor de operações 2 meses antes."),
      makeAnswer("v4_q2", 4, "Sempre trago sugestões de melhoria nos rituais. Recentemente propus automatizar o relatório mensal de People."),
      makeAnswer("v5_q1", 4, "Uso Claude e ChatGPT diariamente para análise de dados, rascunhos de comunicação e pesquisas."),
      makeAnswer("v5_q2", 3, "Compartilho prompts e técnicas quando o time pergunta."),
    ],
    calibration: null,
  },

  // 3. Isabela (par) avalia Lara
  {
    id: `sim-par-lara-${Date.now() + 2}`,
    employee_id: LARA_ID,
    evaluator_id: ISABELA_ID,
    evaluation_type: "par",
    status: "concluida",
    date: now,
    answers: [
      makeAnswer("v1_q1", 3, "Lara é persistente. Quando tem um problema, não desiste fácil."),
      makeAnswer("v1_q2", 3, "Cumpre o que combina e comunica quando está apertada."),
      makeAnswer("v2_q1", 4, "Sempre traz dados quando propõe algo. É muito analítica."),
      makeAnswer("v2_q2", 3, "Aceita quando trazemos visões diferentes."),
      makeAnswer("v3_q1", 3, "Se organiza bem. Não costuma atrasar entregas."),
      makeAnswer("v3_q2", 3, "Entrega de forma direta, sem complicar."),
      makeAnswer("v4_q1", 3, "Identifica problemas e avisa o time. Não espera virar crise."),
      makeAnswer("v4_q2", 3, "Traz sugestões quando discutimos processos."),
      makeAnswer("v5_q1", 3, "Usa IA no dia a dia, parece fazer parte do fluxo dela."),
      makeAnswer("v5_q2", 3, "Compartilha quando perguntamos. Não faz sessões formais."),
    ],
    calibration: null,
  },

  // 4. Lara avalia Mario (liderado avaliando gestor)
  {
    id: `sim-liderado-mario-${Date.now() + 3}`,
    employee_id: MARIO_ID,
    evaluator_id: LARA_ID,
    evaluation_type: "liderado",
    status: "concluida",
    date: now,
    answers: [
      makeAnswer("v1_q1", 4, "Mario é muito resiliente como líder. Quando tivemos cortes no orçamento, ele reorganizou a área sem perder qualidade."),
      makeAnswer("v1_q2", 3, "Se compromete com as metas e cobra a equipe de forma equilibrada."),
      makeAnswer("v2_q1", 3, "Usa dados para decisões estratégicas. Pede que o time faça o mesmo."),
      makeAnswer("v2_q2", 4, "Quando discordamos e trazemos dados, ele reconsidera rápido. Já mudou decisões por causa de análises que apresentei."),
      makeAnswer("v3_q1", 3, "Define bem as prioridades da área e comunica ao time."),
      makeAnswer("v3_q2", 3, "Não burocrático. Busca simplicidade nos processos."),
      makeAnswer("v4_q1", 3, "Identifica riscos e comunica ao time para prevenir."),
      makeAnswer("v4_q2", 3, "Implementa melhorias quando identifica oportunidade."),
      makeAnswer("v5_q1", 3, "Usa IA ocasionalmente. Não é power user mas incentiva o time a usar."),
      makeAnswer("v5_q2", 4, "Incentiva muito o time a usar IA. Criou espaço para compartilharmos aprendizados."),
    ],
    calibration: null,
  },
];

async function insertEvaluation(evalData) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/evaluations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": "resolution=merge-duplicates",
    },
    body: JSON.stringify(evalData),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`ERRO ao inserir ${evalData.evaluation_type} (${evalData.evaluator_id} → ${evalData.employee_id}):`, text);
  } else {
    console.log(`✓ ${evalData.evaluation_type}: ${evalData.evaluator_id} → ${evalData.employee_id}`);
  }
}

async function main() {
  console.log("Inserindo avaliações simuladas...\n");
  for (const ev of evaluations) {
    await insertEvaluation(ev);
  }
  console.log("\nPronto! Avaliações simuladas inseridas.");
}

main();
