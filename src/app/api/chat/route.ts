import { NextRequest, NextResponse } from "next/server";
import type { EvaluationType } from "@/lib/types";

interface ScaleLevel {
  score: number;
  label: string;
  description: string;
  examples: string[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface PreviousAnswer {
  questionTitle: string;
  category: string;
  justification: string;
  score: number | null;
  aiReasoning?: string;
}

interface HolisticAnswer {
  questionId: string;
  questionTitle: string;
  category: string;
  score: number;
  justification: string;
}

interface ChatRequest {
  question: {
    title: string;
    description: string;
    category: string;
    scale: ScaleLevel[];
  };
  employeeName: string;
  justification: string;
  chatHistory: ChatMessage[];
  directorInsights?: string[];
  previousAnswers?: PreviousAnswer[];
  mode: "discuss" | "score" | "contest" | "challenge" | "holistic";
  chosenScore?: number;
  evaluationType?: EvaluationType;
  evaluatorSector?: string;
  evaluateeSector?: string;
  evaluateeCargo?: string;
  allAnswers?: HolisticAnswer[];
}

// ── CALIBRATION RULES (shared across all types) ──

const CALIBRATION_RULES = `CALIBRAGEM IMPORTANTE:
- A MAIORIA dos colaboradores é nota 3 (Dentro do esperado). Isso é bom — significa que faz o que se espera.
- Nota 4 e 5 são RARAS. Exigem evidências extraordinárias e consistentes.
- Nota 1 e 2 também são significativas — exigem padrão claro de comportamento negativo.
- NÃO infle notas. Ser "bom" é nota 3. Ser "excepcional" é nota 5.

ESCALA DE EVIDÊNCIAS (use para calibrar CADA resposta):
- Nota 1: Comportamento NÃO demonstrado. Passividade, transferência de responsabilidade, frustração sem ação. Sinais: "não havia o que fazer", "era problema de outro time", "ficou frustrado e parou".
- Nota 2: Tentativa limitada. Seguiu processo padrão mas precisou de orientação constante do líder. Sinais: "tentou resolver mas precisou de ajuda", "seguiu o protocolo", "com bastante orientação da liderança".
- Nota 3: Comportamento esperado. Identificou o problema, comunicou, agiu para minimizar impacto. Reação adequada mas REATIVA (responde ao problema, não antecipa). Sinais: "identificou o problema", "comunicou o time", "reorganizou prioridades".
- Nota 4: Acima da média. PROATIVO — propôs alternativas antes de ser pedido, mobilizou recursos de outras áreas, buscou soluções criativas. Sinais: "propôs redistribuir tarefas", "alinhou com outras áreas", "conseguiu apoio externo".
- Nota 5: Excepcional. LIDEROU a resolução — assumiu a frente, coordenou múltiplas áreas, estruturou plano de ação, gerou impacto mensurável (evitou prejuízo ao cliente). Sinais: "assumiu a frente", "organizou reuniões", "estruturou plano de ação", "evitou impacto no cliente".

DIFERENÇAS CRÍTICAS ENTRE NOTAS (a IA DEVE respeitar):
- 2 vs 3: Se precisou do líder para conduzir → máximo 2. Se agiu sozinho → mínimo 3.
- 3 vs 4: Se reagiu ao problema → 3. Se se antecipou ou mobilizou recursos além do time → 4.
- 4 vs 5: Se propôs soluções → 4. Se LIDEROU a resolução com impacto mensurável → 5.

SINAIS QUE REDUZEM NOTA:
- "não havia muito o que fazer" → passividade → nota 1
- "precisou de orientação" / "com ajuda do líder" → dependência → máximo 2
- "seguiu o processo padrão" → sem iniciativa extra → máximo 3
- Ausência de exemplos concretos → máximo 3
- Resposta vaga ou genérica → máximo 3
- "baseado na percepção", "sem números" → sem dados → nota 1 (em valores analíticos)
- "às vezes", "em algumas situações" → inconsistente → máximo 2
- "desanimou", "reduziu o ritmo", "aceitou" → desistência → nota 1

SINAIS QUE AUMENTAM NOTA:
- "propôs", "sugeriu alternativa" → proatividade → mínimo 3
- "alinhou com outras áreas", "mobilizou recursos" → coordenação → mínimo 4
- "assumiu a frente", "estruturou plano", "evitou impacto" → liderança → 5
- "trouxe dados específicos", "mostrou indicadores" → embasamento → mínimo 4
- "analisou dados históricos", "comparou resultados", "fez projeção" → análise estruturada → 5

EIXOS DE AVALIAÇÃO POR TIPO DE VALOR:
1. Valores de AÇÃO (Sangue no Olho, Proatividade): eixo passividade → dependência → adequado → proativo → liderança
2. Valores ANALÍTICOS — Embasamento (Foco em Fatos e Dados): eixo opinião → dados esporádicos → dados regulares → dados específicos → análise multi-fonte com projeção
3. Valores ANALÍTICOS — Abertura (Foco em Fatos e Dados): eixo rigidez ("defende e ignora") → resistência passiva ("ouve mas mantém") → abertura reativa ("reavalia") → colaboração ativa ("ajuda a ajustar") → liderança adaptativa ("reconhece rápido e puxa o time")
4a. Valores de EXECUÇÃO — Priorização (Priorize e Simplifique): eixo caos ("foca no errado") → dependência ("tenta mas precisa do líder") → organização ("alinha e organiza sozinho") → otimização ("usa critérios explícitos: impacto, prazo") → orquestração ("plano estruturado, redistribui recursos do time, visão estratégica")
4b. Valores de EXECUÇÃO — Simplificação (Priorize e Simplifique): eixo complicador ("propõe soluções complexas demais") → consciente passivo ("reconhece complexidade mas não age") → simplificador pontual ("sugere ajustes") → simplificador com resultado ("revisa fluxo, reduz retrabalho") → simplificador sistêmico ("redesenha processo, adotado pelo time")
5a. Valores de PROATIVIDADE — Antecipação: eixo reativo ("reage quando já aconteceu") → percebe mas espera ("percebe risco mas espera mandarem agir") → alerta ("identifica risco e avisa o time") → age preventivamente ("se antecipa e busca alternativas") → prevê e resolve ("identifica gargalo que ainda não se manifestou e resolve antes")
5b. Valores de PROATIVIDADE — Proposição de melhorias: eixo passivo ("segue processo, não sugere") → contribui quando puxado ("sugere quando pedem") → propõe ("aponta melhorias espontaneamente") → analisa e propõe ("investiga causa e sugere ajuste concreto") → implementa com resultado ("investiga, implementa e gera resultado mensurável")
6a. Valores de INOVAÇÃO — Uso de IA (AI First): eixo resistência ("não usa, tudo manual") → uso pontual ("usou em situações pontuais, fora do fluxo") → uso regular ("costuma usar para acelerar, faz parte do dia a dia") → uso estratégico ("usa para resultado específico, ganhar eficiência") → multiplicador ("usa + compartilha boas práticas + ensina colegas")
6b. Valores de INOVAÇÃO — Disseminação de IA (AI First): eixo isolado ("não compartilha, não discute") → informal ("comenta em conversas informais") → compartilha ("comenta com colegas quando descobre algo") → ensina ("mostra para o time, explica como aplicar") → organiza e acompanha ("organiza momentos dedicados, ajuda colegas a aplicar no dia a dia")

SINAIS ESPECÍFICOS — DISSEMINAÇÃO DE IA:
- "não costuma compartilhar" → isolado → nota 1
- "conversas informais", "não compartilha muito além" → informal → nota 2
- "costuma comentar com colegas", "explicar como pode ajudar" → compartilha → nota 3
- "mostrou para o time", "explicou como aplicar" → ensina ativamente → nota 4
- "organizou momentos", "ajuda colegas a aplicar no dia a dia" → organiza e acompanha → nota 5

SINAIS ESPECÍFICOS — USO DE IA:
- "não utiliza", "forma totalmente manual" → resistência → nota 1
- "algumas situações pontuais", "não faz parte do fluxo" → uso pontual → nota 2
- "costuma usar", "acelerar o trabalho", "primeiras versões" → uso regular → nota 3
- "estruturar análise", "entregar mais rapidamente", "ganhar eficiência" → uso estratégico → nota 4
- "compartilhar boas práticas", "ajudou colegas", "ensinar" → multiplicador → nota 5

SINAIS ESPECÍFICOS — PROPOSIÇÃO DE MELHORIAS:
- "apenas segue o processo", "não costuma sugerir" → passivo → nota 1
- "às vezes contribui", "espera alguém puxar" → contribui quando puxado → nota 2
- "costuma apontar melhorias", "discutir alternativas" → propõe → nota 3
- "analisou o que aconteceu", "sugeriu ajustes no processo" → analisa e propõe → nota 4
- "investigou as causas", "ajudou a implementar", "reduziu significativamente os erros" → implementa com resultado → nota 5

SINAIS ESPECÍFICOS — ANTECIPAÇÃO DE PROBLEMAS:
- "reage quando já aconteceram" → reativo → nota 1
- "percebe possíveis problemas", "espera alguém pedir" → percebe mas espera → nota 2
- "identificou que poderia atrasar", "avisou com antecedência" → alerta → nota 3
- "se antecipou", "buscando alternativas para evitar impacto" → ação preventiva → nota 4
- "identificou possível gargalo que ainda não tinha causado problemas", "evitar atrasos" → previsão + resolução antecipada → nota 5

SINAIS ESPECÍFICOS — SIMPLIFICAÇÃO:
- "soluções bastante complexas", "aumentando tempo de execução" → complicador → nota 1
- "reconhece quando está complexo", "nem sempre toma iniciativa" → consciente passivo → nota 2
- "costuma sugerir ajustes", "mais simples" → simplificador pontual → nota 3
- "revisou um fluxo", "reduzindo retrabalho" → simplificação com resultado → nota 4
- "redesenhou o fluxo", "eliminou etapas", "utilizado por todo o time" → simplificação sistêmica → nota 5

SINAIS ESPECÍFICOS — PRIORIZAÇÃO:
- "se confundir", "foca em tarefas menos importantes" → caos → nota 1
- "precisa de ajuda da liderança para definir" → dependência → nota 2
- "alinha com o time", "organiza a agenda" → organização adequada → nota 3
- "analisa impacto e prazo", "reorganiza planejamento" → critérios objetivos → nota 4
- "estruturou plano", "redistribuiu tarefas", "impacto no cliente e prazos estratégicos" → orquestração → nota 5

SINAIS ESPECÍFICOS — ABERTURA A EVIDÊNCIAS:
- "defende bastante", "dificilmente muda" → rigidez → nota 1
- "mantém a posição", "só muda com insistência ou orientação do líder" → resistência → nota 2
- "costuma reavaliar", "considera ajustes" → abertura adequada → nota 3
- "reconsiderou a análise", "ajudou a ajustar a decisão" → colaboração ativa → nota 4
- "rapidamente reconheceu", "revisou a estratégia", "incentivou o time" → liderança adaptativa → nota 5

RÉGUA DE AUTONOMIA (aplique em TODA nota):
- Faz bem MAS o líder precisa estar em cima (cobrar, organizar, lembrar) → tende a 2
- Faz bem E é autônomo (líder não precisa se preocupar) → tende a 3
- Faz bem, é autônomo E PROPÕE soluções → tende a 4
- Faz bem, é autônomo, LIDERA resolução E eleva outros → tende a 5`;

const CROSS_CONTEXT_RULES = `CONTEXTO CRUZADO:
- Se há respostas anteriores sobre este colaborador, USE essa informação para questionar consistência
- Contradições entre respostas devem ser apontadas e refletidas na nota`;

const DISCUSS_RULES = `Regras:
- Peça EXEMPLOS CONCRETOS e RECENTES (últimos 6 meses)
- Investigue frequência: foi uma vez ou é consistente?
- Questione com firmeza se a resposta for vaga ou genérica
- Faça UMA pergunta por vez
- Seja direto e conciso (máximo 150 palavras)
- Use **negrito** para destaques
- Responda em português (pt-BR)`;

// ── DISCUSS PROMPTS PER EVALUATION TYPE ──

const DISCUSS_PROMPTS: Record<EvaluationType, string> = {
  gestor: `Você é o Avaliador de Desempenho da Seazone, integrado à plataforma IAVD.

Seu papel é investigar com rigor o desempenho de um colaborador a partir da perspectiva do GESTOR DIRETO. Você NÃO dá a nota agora — isso vem depois. Agora você investiga com ceticismo saudável.

${CALIBRATION_RULES}

FOCO DA INVESTIGAÇÃO (gestor avaliando liderado):
- Investigue autonomia: "Quanto da sua energia de liderança esse colaborador demanda?"
- Pergunte sobre organização: "Você precisa cobrar prazos ou ele se autogerencia?"
- Explore impacto: "Qual foi o resultado concreto do trabalho dele?"
- Verifique consistência: "Isso acontece sempre ou foi pontual?"

${CROSS_CONTEXT_RULES}

${DISCUSS_RULES}`,

  auto: `Você é o Avaliador de Desempenho da Seazone, integrado à plataforma IAVD.

Seu papel é investigar a AUTOCONSCIÊNCIA do colaborador sobre seu próprio desempenho. Você NÃO dá a nota agora — isso vem depois. Agora você investiga com ceticismo saudável.

${CALIBRATION_RULES}

FOCO DA INVESTIGAÇÃO (autoavaliação):
- Desafie autoinflação: "O que seus colegas diriam sobre isso?"
- Peça evidências externas: "Que feedback você recebeu do seu gestor sobre isso?"
- Explore pontos cegos: "Onde você sentiu mais dificuldade nos últimos 6 meses?"
- Investigue autocrítica: "O que você poderia ter feito melhor nessa situação?"
- Se a pessoa se avaliar muito positivamente sem exemplos concretos, questione com firmeza

${CROSS_CONTEXT_RULES}

${DISCUSS_RULES}`,

  par: `Você é o Avaliador de Desempenho da Seazone, integrado à plataforma IAVD.

Seu papel é investigar o desempenho de um colega a partir da perspectiva de um PAR (colega de áreas próximas). Você NÃO dá a nota agora — isso vem depois. Agora você investiga com ceticismo saudável.

${CALIBRATION_RULES}

FOCO DA INVESTIGAÇÃO (par avaliando par):
- Investigue colaboração: "Como é trabalhar com essa pessoa em projetos compartilhados?"
- Explore comunicação: "Ela se comunica bem? Cumpre o que combina?"
- Pergunte sobre confiabilidade: "Você pode contar com ela para entregas no prazo?"
- Verifique impacto lateral: "Ela contribui para o seu trabalho ou gera retrabalho?"
- Investigue proatividade: "Ela busca soluções ou espera que os outros resolvam?"
- Note: como par, o avaliador pode não ter visibilidade total — pergunte sobre o que ele OBSERVA diretamente

${CROSS_CONTEXT_RULES}

${DISCUSS_RULES}`,

  liderado: `Você é o Avaliador de Desempenho da Seazone, integrado à plataforma IAVD.

Seu papel é investigar o desempenho de um GESTOR a partir da perspectiva de um LIDERADO. Você NÃO dá a nota agora — isso vem depois. Agora você investiga com ceticismo saudável.

${CALIBRATION_RULES}

FOCO DA INVESTIGAÇÃO (liderado avaliando gestor):
- Investigue liderança: "Seu gestor dá direcionamento claro sobre prioridades?"
- Explore suporte: "Quando você tem dificuldade, ele te ajuda a resolver ou te deixa sozinho?"
- Pergunte sobre desenvolvimento: "Ele investe no seu crescimento? Como?"
- Verifique delegação: "Ele confia em você ou microgerencia?"
- Investigue cultura: "Ele cria um ambiente seguro para errar e aprender?"
- Explore pressão: "Quando há pressão de cima, ele protege a equipe ou repassa a cobrança?"

${CROSS_CONTEXT_RULES}

${DISCUSS_RULES}`,
};

// ── SCORE PROMPT ──

function getScorePrompt(evaluationType: EvaluationType): string {
  const typeContext: Record<EvaluationType, string> = {
    gestor: "Esta é uma avaliação do GESTOR sobre seu liderado.",
    auto: "Esta é uma AUTOAVALIAÇÃO. Considere que autoavaliações tendem a ser infladas — pese isso na nota.",
    par: "Esta é uma avaliação de PAR. O avaliador pode ter visibilidade parcial — considere o que foi observado diretamente.",
    liderado: "Esta é uma avaliação de LIDERADO sobre seu gestor. Foque em liderança, suporte e direcionamento.",
  };

  return `Você é o Avaliador de Desempenho da Seazone. Chegou o momento de dar a nota.

${typeContext[evaluationType]}

${CALIBRATION_RULES}

${CROSS_CONTEXT_RULES}

PROCESSO DE ATRIBUIÇÃO DE NOTA:
1. Liste as evidências concretas mencionadas na conversa
2. Classifique cada evidência como: forte (exemplo específico com resultado), moderada (exemplo mas sem resultado claro), fraca (menção vaga) ou inexistente
3. Aplique a escala de evidências e a régua de autonomia
4. Verifique sinais que reduzem ou aumentam nota
5. Compare com o contexto das outras respostas
6. Dê a nota com justificativa TRANSPARENTE

Regras:
- Cite os exemplos específicos que sustentam a nota
- Explique por que NÃO é a nota acima (o que faltou)
- Se não trouxe exemplos concretos, a nota é 3
- Se há contradição com respostas anteriores, aponte
- Seja justo, direto e firme
- Responda em português (pt-BR)

FORMATO OBRIGATÓRIO:
**Nota: X — [Label]**

[Justificativa de 2-3 parágrafos]`;
}

// ── CONTEST PROMPT ──

function getContestPrompt(evaluationType: EvaluationType): string {
  const typeLabel =
    evaluationType === "auto" ? "o avaliado" :
    evaluationType === "par" ? "o par" :
    evaluationType === "liderado" ? "o liderado" : "o gestor";

  return `Você é o Avaliador de Desempenho da Seazone. ${typeLabel} está contestando a nota.

Regras:
- Analise a contestação com RIGOR — exija FATOS E DADOS novos
- "Eu acho que merece mais" NÃO é argumento. Precisa de exemplos concretos.
- Se trouxer exemplos NOVOS, concretos e relevantes → reavalie
- Se for apenas opinião/sentimento → mantenha a nota e explique por quê com firmeza
- Lembre: a maioria é nota 3. Precisa provar que é diferente.
- Aplique a régua de autonomia
- Você PODE mudar a nota se os novos fatos justificarem
- Você PODE e DEVE manter a nota se os argumentos forem fracos
- Se mudar, use o formato: **Nota: X — [Label]**
- Seja respeitoso mas FIRME — nota inflada prejudica a calibragem e a empresa
- Responda em português (pt-BR)
- Máximo 200 palavras`;
}

// ── CHALLENGE PROMPT (new flow: person picks score, AI challenges if ≠ 3) ──

// Mapeamento score ↔ conceito
const scoreToGrade: Record<number, string> = { 5: "A", 4: "B", 3: "C", 2: "D", 1: "E" };

function getChallengePrompt(evaluationType: EvaluationType, chosenScore: number): string {
  const grade = scoreToGrade[chosenScore] || "C";
  const typeContext: Record<EvaluationType, string> = {
    gestor: "O GESTOR escolheu este conceito para seu liderado.",
    auto: "O colaborador escolheu este conceito na AUTOAVALIAÇÃO.",
    par: "Um PAR escolheu este conceito para o colega.",
    liderado: "Um LIDERADO escolheu este conceito para seu gestor.",
  };

  const direction = chosenScore > 3 ? "acima" : "abaixo";
  const challenge = chosenScore > 3
    ? `A pessoa deu conceito ${grade}, que é ACIMA do esperado (C). Questione com rigor: os exemplos sustentam um conceito acima de C? Conceitos A e B exigem evidências extraordinárias de proatividade, autonomia e impacto mensurável.`
    : `A pessoa deu conceito ${grade}, que é ABAIXO do esperado (C). Verifique: os exemplos realmente demonstram desempenho abaixo? Conceito ${grade} é significativo — exige padrão claro de comportamento negativo.`;

  return `Você é o Avaliador de Desempenho da Seazone, integrado à plataforma IAVD.

${typeContext[evaluationType]}

A pessoa escolheu conceito **${grade}** (${direction} do esperado C). Seu papel é:
1. Analisar a justificativa apresentada
2. Questionar se o conceito ${grade} é adequado com base nas evidências
3. Se os exemplos NÃO sustentarem conceito ${grade}, dizer claramente que na sua análise o conceito deveria ser outro (ex: C) e explicar por quê
4. Se os exemplos SUSTENTAREM o conceito ${grade}, reconhecer que a justificativa é consistente
5. A DECISÃO FINAL é da pessoa — se ela insistir, o conceito será mantido

${challenge}

${CALIBRATION_RULES}

${CROSS_CONTEXT_RULES}

Regras:
- Seja direto, firme e respeitoso
- Faça UMA pergunta por vez
- Se a justificativa for fraca, diga: "Na minha análise, os exemplos apontam mais para conceito C porque [razão]. Você tem certeza que quer manter conceito ${grade}?"
- Se a justificativa for forte, diga: "Os exemplos são consistentes com conceito ${grade}. Pode confirmar."
- NÃO aceite "eu acho" sem exemplos concretos
- Máximo 150 palavras
- Responda em português (pt-BR)`;
}

// ── HOLISTIC PROMPT ──

function getHolisticPrompt(evaluationType: EvaluationType): string {
  const typeContext: Record<EvaluationType, string> = {
    gestor: "Esta é uma avaliação do GESTOR sobre seu liderado.",
    auto: "Esta é uma AUTOAVALIAÇÃO. Autoavaliações tendem a ser infladas.",
    par: "Esta é uma avaliação de PAR. O avaliador pode ter visibilidade parcial.",
    liderado: "Esta é uma avaliação de LIDERADO sobre seu gestor.",
  };

  return `Você é o Avaliador de Desempenho da Seazone, integrado à plataforma IAVD.

${typeContext[evaluationType]}

Você recebeu TODAS as respostas de uma avaliação 360 de uma só vez. Seu papel é:
1. VALIDAR QUALIDADE de CADA justificativa — justificativas vagas, genéricas ou subjetivas NÃO são aceitáveis
2. Analisar CONSISTÊNCIA entre respostas — notas altas em tudo ou notas baixas em tudo são suspeitas
3. Verificar se há INFLAÇÃO generalizada — a maioria deveria ser C (nota 3)
4. Identificar CONTRADIÇÕES — ex: diz que a pessoa é proativa mas não dá exemplos de antecipação

JUSTIFICATIVAS INACEITÁVEIS (SEMPRE questionar, independente do conceito):
- Opiniões subjetivas sem fatos: "é legal", "é dedicado", "trabalha bem", "gosto dele"
- Frases genéricas: "faz o trabalho", "cumpre suas funções", "é competente"
- Justificativas com menos de 2 frases completas
- Sem exemplos concretos de situações reais
- Sem menção a resultados, impacto ou comportamentos observáveis

JUSTIFICATIVAS ACEITÁVEIS devem ter:
- Situações específicas: "No projeto X em janeiro...", "Quando tivemos o problema Y..."
- Resultados concretos: "reduziu tempo em 30%", "evitou perda de R$X"
- Comportamentos observáveis: "tomou a iniciativa de...", "organizou reunião para..."
- Frequência: "consistentemente", "nos últimos 3 meses", "sempre"

${CALIBRATION_RULES}

REGRAS DE RESPOSTA:
- Retorne APENAS JSON válido, sem markdown, sem texto antes ou depois
- Formato: { "feedback": [{ "questionId": "v1_q1", "currentGrade": "B", "suggestedGrade": "C", "reasoning": "..." }] }
- Inclua feedback para TODAS as perguntas com conceito diferente de C
- Se a justificativa for vaga, genérica ou subjetiva: SEMPRE questione, MESMO que o conceito pareça adequado. Diga exatamente o que falta (ex: "A justificativa 'é legal' não descreve nenhum comportamento observável. Traga um exemplo concreto de quando essa pessoa demonstrou [competência]")
- Se concordar E a justificativa for boa: suggestedGrade = currentGrade
- Se discordar OU justificativa ruim: suggestedGrade = o que sugere, reasoning explica
- Para conceito C: questione se TODAS forem C ou se a justificativa for inaceitável
- Máximo 100 palavras por reasoning
- Reasoning em português (pt-BR)
- A DECISÃO FINAL é do avaliador — você apenas analisa e sugere
- Uma pessoa pode usar o MESMO exemplo em múltiplas perguntas — isso é válido`;
}

// ── BUILD MESSAGES ──

function buildMessages(body: ChatRequest) {
  const {
    question,
    employeeName,
    justification,
    chatHistory,
    directorInsights,
    previousAnswers,
    mode,
    chosenScore,
    evaluationType = "gestor",
    evaluatorSector,
    evaluateeSector,
    evaluateeCargo,
  } = body;

  let systemPrompt: string;
  if (mode === "holistic") systemPrompt = getHolisticPrompt(evaluationType);
  else if (mode === "challenge") systemPrompt = getChallengePrompt(evaluationType, chosenScore ?? 3);
  else if (mode === "score") systemPrompt = getScorePrompt(evaluationType);
  else if (mode === "contest") systemPrompt = getContestPrompt(evaluationType);
  else systemPrompt = DISCUSS_PROMPTS[evaluationType];

  const typeLabels: Record<EvaluationType, string> = {
    auto: "AUTOAVALIAÇÃO",
    gestor: "AVALIAÇÃO DO GESTOR",
    par: "AVALIAÇÃO DE PAR",
    liderado: "AVALIAÇÃO DE LIDERADO",
  };

  // Holistic mode: build context from all answers
  if (mode === "holistic" && body.allAnswers) {
    const gradeMap: Record<number, string> = { 5: "A", 4: "B", 3: "C", 2: "D", 1: "E" };
    // Group by category
    const byCategory: Record<string, typeof body.allAnswers> = {};
    for (const ans of body.allAnswers) {
      if (!byCategory[ans.category]) byCategory[ans.category] = [];
      byCategory[ans.category].push(ans);
    }

    let holisticContext = `CONTEXTO DA AVALIAÇÃO:
- Tipo: ${typeLabels[evaluationType]}
- Colaborador avaliado: ${employeeName}${evaluateeCargo ? ` (${evaluateeCargo})` : ""}${evaluateeSector ? ` — Setor: ${evaluateeSector}` : ""}${evaluatorSector ? `\n- Setor do avaliador: ${evaluatorSector}` : ""}

TODAS AS RESPOSTAS (${body.allAnswers.length} perguntas):
`;

    for (const [cat, answers] of Object.entries(byCategory)) {
      holisticContext += `\n[${cat}]\n`;
      for (const ans of answers) {
        const grade = gradeMap[ans.score] || "C";
        holisticContext += `  - ${ans.questionId} "${ans.questionTitle}": Conceito ${grade} (nota ${ans.score})`;
        if (ans.justification.trim()) {
          holisticContext += `\n    Justificativa: "${ans.justification}"`;
        }
        holisticContext += "\n";
      }
    }

    // Stats
    const scores = body.allAnswers.map((a) => a.score);
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    const nonC = scores.filter((s) => s !== 3).length;
    holisticContext += `\nESTATÍSTICAS:
- Média: ${avg.toFixed(1)}
- Respostas diferentes de C: ${nonC} de ${scores.length}
- Distribuição: ${[5, 4, 3, 2, 1].map((s) => `${gradeMap[s]}=${scores.filter((v) => v === s).length}`).join(", ")}`;

    const messages: { role: "user" | "assistant"; content: string }[] = [
      { role: "user", content: holisticContext },
    ];

    return { systemPrompt, messages };
  }

  let context = `CONTEXTO DA AVALIAÇÃO:
- Tipo: ${typeLabels[evaluationType]}
- Colaborador avaliado: ${employeeName}${evaluateeCargo ? ` (${evaluateeCargo})` : ""}${evaluateeSector ? ` — Setor: ${evaluateeSector}` : ""}${evaluatorSector ? `\n- Setor do avaliador: ${evaluatorSector}` : ""}
- Valor Seazone: "${question.category}"
- Pergunta: "${question.title}" — ${question.description}

ESCALA (interpretação da diretoria — 3 é o padrão para a maioria):
${question.scale.map((s) => `  Nota ${s.score} (${s.label}): ${s.description}\n    Exemplos: ${s.examples.join("; ")}`).join("\n")}`;

  if (directorInsights && directorInsights.length > 0) {
    context += `\n\nINTERPRETAÇÕES PERSONALIZADAS DA DIRETORIA:\n${directorInsights.map((i, idx) => `  ${idx + 1}. ${i}`).join("\n")}`;
  }

  if (previousAnswers && previousAnswers.length > 0) {
    context += `\n\nRESPOSTAS ANTERIORES SOBRE ${employeeName.toUpperCase()} (use para verificar consistência):`;
    for (const prev of previousAnswers) {
      context += `\n- [${prev.category}] "${prev.questionTitle}": ${prev.justification}`;
      if (prev.score !== null) context += ` → Nota IA: ${prev.score}`;
      if (prev.aiReasoning) context += ` | Razão: ${prev.aiReasoning.substring(0, 200)}...`;
    }
    context += `\n\nUSE essas informações para questionar contradições ou confirmar padrões.`;
  }

  if (justification) {
    const whoLabel = evaluationType === "auto" ? "RESPOSTA DO AVALIADO" : "RESPOSTA DO AVALIADOR";
    context += `\n\n${whoLabel} À PERGUNTA ATUAL: "${justification}"`;
  }

  const messages: { role: "user" | "assistant"; content: string }[] = [
    { role: "user", content: context },
  ];

  for (const msg of chatHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  return { systemPrompt, messages };
}

// ── API HANDLER ──

export async function POST(req: NextRequest) {
  const body: ChatRequest = await req.json();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === "sua-chave-aqui") {
    return fallbackResponse(body);
  }

  try {
    const { systemPrompt, messages } = buildMessages(body);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: body.mode === "holistic" ? 2000 : 600,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      console.error("Anthropic API error:", response.status);
      return fallbackResponse(body);
    }

    const data = await response.json();
    const content =
      data.content?.[0]?.text || "Desculpe, não consegui gerar uma resposta.";

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Chat API error:", error);
    return fallbackResponse(body);
  }
}

// ── FALLBACK (rule-based) ──

function fallbackResponse(body: ChatRequest) {
  const {
    question,
    employeeName,
    justification,
    chatHistory,
    previousAnswers,
    mode,
    evaluationType = "gestor",
  } = body;

  // Mode: holistic — rule-based fallback (gives feedback on ALL non-C grades + questions all-C)
  if (mode === "holistic" && body.allAnswers) {
    const gradeMap: Record<number, string> = { 5: "A", 4: "B", 3: "C", 2: "D", 1: "E" };
    const feedback: { questionId: string; currentGrade: string; suggestedGrade: string; reasoning: string }[] = [];
    const cCount = body.allAnswers.filter((a) => a.score === 3).length;
    const allOrMostlyC = cCount >= body.allAnswers.length - 1;

    // If all/most answers are C, question them
    if (allOrMostlyC) {
      for (const ans of body.allAnswers) {
        if (ans.score !== 3) continue;
        feedback.push({
          questionId: ans.questionId,
          currentGrade: "C",
          suggestedGrade: "C",
          reasoning: `Todas (ou quase todas) as respostas são C. Isso pode indicar que a avaliação foi feita sem reflexão profunda. Há alguma competência em que ${employeeName} se destaca positivamente ou precisa melhorar? Considere se realmente não há diferenças entre as competências.`,
        });
      }
      return NextResponse.json({ content: JSON.stringify({ feedback }) });
    }

    for (const ans of body.allAnswers) {
      if (ans.score === 3) continue;

      const grade = gradeMap[ans.score] || "C";
      const just = ans.justification.trim();
      const justLen = just.length;
      const hasExamples = /exemplo|situação|caso|vez que|quando|projeto|entrega|reunião|resultado|dados|indicador|específic|reduzi|aument|implement|organiz|propôs|criou|liderou/i.test(just);
      const hasPattern = /sempre|consistente|padrão|frequente|repetid|constante|nunca|não consegue/i.test(just);
      const isVague = /^(é legal|é bom|trabalha bem|é dedicad|gosto|é competente|faz o trabalho|cumpre|é esforçad|é comprometid|muito bom|excelente|ótim|tranquil)/i.test(just) ||
        (!hasExamples && justLen < 80);

      // Vague/subjective justification → always reject
      if (isVague) {
        feedback.push({
          questionId: ans.questionId,
          currentGrade: grade,
          suggestedGrade: "C",
          reasoning: `A justificativa "${just.substring(0, 40)}${justLen > 40 ? "..." : ""}" é vaga ou subjetiva. Uma avaliação precisa de exemplos concretos: situações reais, comportamentos observados e resultados. Descreva o que aconteceu, quando e qual foi o impacto.`,
        });
        continue;
      }

      // Short justification → disagree
      if (justLen < 50) {
        feedback.push({
          questionId: ans.questionId,
          currentGrade: grade,
          suggestedGrade: "C",
          reasoning: `A justificativa é muito curta. Conceitos diferentes de C exigem exemplos concretos e detalhados com situações reais.`,
        });
        continue;
      }

      // High grades without examples → disagree
      if (ans.score >= 4 && !hasExamples) {
        feedback.push({
          questionId: ans.questionId,
          currentGrade: grade,
          suggestedGrade: "C",
          reasoning: `Conceito ${grade} exige evidências concretas de desempenho acima do esperado. A justificativa não menciona exemplos específicos ou resultados mensuráveis.`,
        });
        continue;
      }

      // Low grades without pattern → disagree
      if (ans.score <= 2 && !hasPattern) {
        feedback.push({
          questionId: ans.questionId,
          currentGrade: grade,
          suggestedGrade: "C",
          reasoning: `Conceito ${grade} exige padrão claro de comportamento. A justificativa não indica se isso é consistente ou pontual.`,
        });
        continue;
      }

      // Otherwise → agree
      feedback.push({
        questionId: ans.questionId,
        currentGrade: grade,
        suggestedGrade: grade,
        reasoning: ans.score >= 4
          ? `A justificativa traz evidências concretas que sustentam conceito ${grade}. Os exemplos demonstram desempenho acima do esperado.`
          : `A justificativa descreve um padrão consistente que justifica conceito ${grade}.`,
      });
    }

    // Inflation warning
    const nonCCount = body.allAnswers.filter((a) => a.score !== 3).length;
    if (nonCCount >= 7) {
      const firstAgree = feedback.find(f => f.suggestedGrade === f.currentGrade);
      if (firstAgree) {
        firstAgree.reasoning += ` Atenção: ${nonCCount} de ${body.allAnswers.length} respostas são diferentes de C — revise se todas são justificadas.`;
      }
    }

    return NextResponse.json({ content: JSON.stringify({ feedback }) });
  }

  const userMessages = chatHistory.filter((m) => m.role === "user");
  const userMsgCount = userMessages.length;

  const prevContext =
    previousAnswers && previousAnswers.length > 0
      ? previousAnswers.map((p) => p.justification).join(" ").toLowerCase()
      : "";
  const needsLeader =
    /ajuda|acompanhar|cobr|lembr|organiz|depende|precisa do líder|demanda/i.test(
      prevContext
    );

  if (mode === "score") {
    const totalContent = userMessages.map((m) => m.content).join(" ");
    const hasExamples =
      /exemplo|situação|caso|vez que|quando|projeto|entrega|reunião|resultado/i.test(
        totalContent
      );
    const mentionsAutonomy =
      /sozinho|autônom|independente|sem precisar|por conta/i.test(totalContent);
    const mentionsDependency =
      /ajuda|acompanhar|cobr|lembr|precisa|depende/i.test(totalContent);
    const isDetailed = totalContent.length > 200;

    let score = 3;
    let label = "Dentro do esperado";

    if (mentionsDependency || needsLeader) {
      if (hasExamples && isDetailed) {
        score = 3;
        label = "Dentro do esperado";
      } else {
        score = 2;
        label = "Abaixo do esperado";
      }
    } else if (hasExamples && isDetailed && mentionsAutonomy) {
      score = 4;
      label = "Acima do esperado";
    }

    // Autoavaliação: descontar 1 ponto se inflado sem exemplos
    if (evaluationType === "auto" && score > 3 && !isDetailed) {
      score = 3;
      label = "Dentro do esperado";
    }

    const scaleLevel = question.scale.find((s) => s.score === score);
    const above = question.scale.find((s) => s.score === score + 1);

    let response = `**Nota: ${score} — ${label}**\n\n`;
    response += `Com base na nossa conversa sobre **${employeeName}** no valor "${question.category}":\n\n`;

    if (score === 3) {
      response += `Os exemplos trazidos são consistentes com o esperado para a posição: "${scaleLevel?.description}"\n\n`;
      if (mentionsDependency || needsLeader) {
        response += `**Ponto de atenção:** ficou claro que ${employeeName} ainda demanda acompanhamento. Isso limita a nota — autonomia é fator-chave para nota 4+.\n\n`;
      }
    } else if (score === 2) {
      response += `Os relatos indicam que ${employeeName} precisa de acompanhamento constante. `;
      response += `Nota 3 exigiria comportamento **autônomo e consistente**.\n\n`;
    }

    if (above) {
      response += `Para nota ${above.score}, seria necessário: "${above.description}"`;
    }

    return NextResponse.json({ content: response });
  }

  if (mode === "contest") {
    const lastMsg = userMessages[userMessages.length - 1]?.content || "";
    const hasNewExamples =
      /exemplo|situação|caso|vez que|quando|projeto|entrega/i.test(lastMsg);
    const mentionsAutonomy =
      /sozinho|autônom|independente|sem precisar|por conta/i.test(lastMsg);

    if (hasNewExamples && lastMsg.length > 80 && mentionsAutonomy) {
      return NextResponse.json({
        content:
          `O exemplo que você trouxe agora é relevante — especialmente a parte sobre autonomia. Reavaliando:\n\n` +
          `**Nota: 4 — Acima do esperado**\n\n` +
          `Se ${employeeName} faz isso de forma consistente e sem demandar acompanhamento, a nota 4 é justa.`,
      });
    }

    if (hasNewExamples && lastMsg.length > 80) {
      return NextResponse.json({
        content:
          `O exemplo é válido, mas mantenho a nota. O que você descreveu é consistente com o **esperado** para a posição.\n\n` +
          `Para uma nota acima de 3, eu precisaria ver:\n` +
          `• **Autonomia**: faz isso **sem** o líder precisar cobrar?\n` +
          `• **Consistência**: acontece sempre ou foi um episódio?\n` +
          `• **Impacto além do escopo**: eleva o nível de outros?\n\n` +
          `Se tiver evidência nesses 3 pontos, posso reavaliar.`,
      });
    }

    return NextResponse.json({
      content:
        `A contestação precisa trazer **fatos e dados novos**, não opinião.\n\n` +
        `Ser "bom" é nota 3 — o esperado. Para nota maior, preciso de:\n` +
        `• **Exemplos concretos** novos\n` +
        `• **Evidência de autonomia**\n` +
        `• **Impacto mensurável**\n\n` +
        `Tem algum fato novo?`,
    });
  }

  // Mode: challenge — person picked a grade ≠ C
  if (mode === "challenge") {
    const chosenScore = body.chosenScore ?? 3;
    const grade = scoreToGrade[chosenScore] || "C";
    const userMessages = chatHistory.filter((m) => m.role === "user");

    if (userMessages.length <= 1) {
      const isVague = !justification || justification.length < 30;
      if (isVague) {
        return NextResponse.json({
          content: `Você deu conceito **${grade}** para **${employeeName}**. A maioria das pessoas é conceito C (dentro do esperado).\n\nPreciso de **exemplos concretos e recentes** que justifiquem esse conceito. O que aconteceu nos últimos 6 meses que levou a essa avaliação?`,
        });
      }

      if (chosenScore > 3) {
        return NextResponse.json({
          content: `Entendi sua justificativa. Conceito **${grade}** exige desempenho **acima** do esperado — não basta ser bom, precisa ser excepcional.\n\nPergunto: **${employeeName}** faz isso de forma **autônoma e consistente**? Ou foi algo pontual?`,
        });
      } else {
        return NextResponse.json({
          content: `Entendi sua justificativa. Conceito **${grade}** indica desempenho **abaixo** do esperado — isso é significativo.\n\nConfirme: esse comportamento é **consistente** ou foi uma situação pontual?`,
        });
      }
    }

    if (userMessages.length === 2) {
      const lastMsg = userMessages[userMessages.length - 1]?.content || "";
      const hasExamples = /exemplo|situação|caso|vez que|quando|projeto|entrega|reunião|resultado/i.test(lastMsg);
      const isDetailed = lastMsg.length > 60;

      if (hasExamples && isDetailed) {
        return NextResponse.json({
          content: `Os exemplos que você trouxe são relevantes. Na minha análise, o conceito **${grade}** ${chosenScore > 3 ? "pode ser" : "é"} justificável com base nessas evidências.\n\nSe está seguro, pode **confirmar o conceito ${grade}**.`,
        });
      }

      return NextResponse.json({
        content: `Na minha análise, os exemplos apresentados apontam mais para **conceito C** (dentro do esperado). Para conceito ${grade}, eu esperaria evidências mais concretas de ${chosenScore > 3 ? "proatividade e impacto acima do cargo" : "um padrão claro de comportamento negativo"}.\n\n**Você tem certeza que quer manter conceito ${grade}?** Se sim, pode confirmar.`,
      });
    }

    return NextResponse.json({
      content: `Entendido. A decisão é sua. Se está ciente e quer manter conceito **${grade}**, pode **confirmar** agora.`,
    });
  }

  // Mode: discuss — adapted per evaluation type
  const firstQuestions: Record<EvaluationType, { vague: string; detailed: string }> = {
    gestor: {
      vague: `Preciso de mais substância para avaliar **${employeeName}** em "${question.title}".\n\nMe dê uma **situação concreta e recente** (últimos 6 meses). O que aconteceu? O que ${employeeName} fez? Qual foi o resultado?`,
      detailed: `Entendi o cenário. Agora preciso entender a **autonomia**:\n\n${employeeName} fez isso **por conta própria** ou você precisou cobrar, organizar ou acompanhar de perto?`,
    },
    auto: {
      vague: `Preciso de mais substância na sua autoavaliação em "${question.title}".\n\nMe dê uma **situação concreta e recente** (últimos 6 meses). O que aconteceu? O que **você** fez? Qual foi o resultado?`,
      detailed: `Entendi. Agora uma pergunta importante: **o que seus colegas ou seu gestor diriam sobre isso?**\n\nVocê recebeu algum feedback externo que confirme essa percepção?`,
    },
    par: {
      vague: `Preciso de mais detalhes para avaliar **${employeeName}** como par em "${question.title}".\n\nMe dê uma **situação concreta** em que vocês trabalharam juntos ou em que você observou esse comportamento.`,
      detailed: `Entendi o cenário. Sobre a **confiabilidade**:\n\nQuando você depende de ${employeeName} para algo, ele entrega no prazo e com qualidade? Ou você precisa ficar cobrando?`,
    },
    liderado: {
      vague: `Preciso de mais detalhes para avaliar **${employeeName}** como gestor em "${question.title}".\n\nMe dê uma **situação concreta** em que a liderança dele(a) impactou seu trabalho — positiva ou negativamente.`,
      detailed: `Entendi. Sobre o **suporte**:\n\nQuando você tem dificuldade, ${employeeName} te ajuda a resolver? Ele(a) cria espaço para você errar e aprender?`,
    },
  };

  if (userMsgCount <= 1) {
    const isVague =
      !justification ||
      justification.length < 30 ||
      !/exemplo|situação|caso|vez que|quando|projeto|entrega|reunião/i.test(
        justification
      );

    const prompts = firstQuestions[evaluationType];
    return NextResponse.json({
      content: isVague ? prompts.vague : prompts.detailed,
    });
  }

  if (userMsgCount === 2) {
    if (needsLeader) {
      return NextResponse.json({
        content:
          `Ponto importante: nas respostas anteriores, foi mencionado que ${employeeName} precisa de acompanhamento da liderança. ` +
          `Isso é consistente com o que você está descrevendo aqui?\n\n` +
          `Quando estiver pronto, clique em **"Receber nota da IA"**.`,
      });
    }

    return NextResponse.json({
      content:
        `Último ponto: com que **frequência** isso acontece? ` +
        `É o comportamento padrão de ${employeeName} ou foi algo pontual?\n\n` +
        `Quando estiver pronto, clique em **"Receber nota da IA"**.`,
    });
  }

  return NextResponse.json({
    content: `Tenho contexto suficiente. Clique em **"Receber nota da IA"** para eu consolidar minha avaliação.`,
  });
}
