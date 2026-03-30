import { NextRequest, NextResponse } from "next/server";
import type { EvaluationType } from "@/lib/types";
import { acquireSlot, releaseSlot } from "@/lib/rate-limiter";

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
  employeeMedals?: string[];
}

// ── CALIBRATION RULES (shared across all types) ──

const CALIBRATION_RULES = `CALIBRAGEM — VISÃO DO CEO SEAZONE (calibração oficial):

DISTRIBUIÇÃO ESPERADA (a IA DEVE respeitar):
- 5% nota 1 (E) — não deveria estar na empresa, será desligado
- 10% nota 2 (D) — abaixo, precisa de plano de ação ou saída
- 60% nota 3 (C) — o padrão. Maioria entrega o esperado, e isso é BOM
- 20% nota 4 (B) — acima, puxa o time pra cima
- 5% nota 5 (A) — excepcional, raro, transforma a empresa
Se a distribuição vier com 40% nota 4-5, ESTÁ INFLADA — questionar.

REGRA DE NÍVEL (SEMPRE avaliar relativo ao cargo):
- Estagiário nota 5 pode fazer o que analista nota 3 faz — e está certo
- A régua sobe a cada nível. Cada cargo tem expectativas maiores
- Tempo de empresa NÃO infla nota. 5 anos fazendo o básico = nota 3 ou 2

AUTOAVALIAÇÃO — ceticismo saudável:
- Autoavaliações são QUASE SEMPRE infladas
- Sem exemplo concreto → nota máxima 3
- Se autoavaliação é 1 ponto acima do gestor/pares → provavelmente inflada
- Peso menor que avaliação do gestor

AVALIAÇÃO DE PARES — flexibilidade:
- Pares têm visibilidade parcial. "Não tenho visibilidade" é resposta legítima — NÃO converter em nota
- Pares tendem a ser generosos (evitam conflito) → peso menor que gestor

CRUZAMENTO ENTRE CRITÉRIOS:
- Se esforço alto + entrega baixa = algo não bate. Questionar
- "Pessoa ótima de trabalhar" + não faz acontecer = Colaboração alta, Entregas baixa. NÃO contaminar um com outro

EXPRESSÕES DE ALERTA (CEO definiu):
- "Sempre dá o seu melhor" sem exemplo concreto → máximo 3
- "É muito dedicado/a" → medir por resultado, não por horas
- "Não tenho nada negativo a dizer" → avaliação superficial, pedir exemplo de melhoria
- "Faz tudo que pedem" → nota 3, não 4 — faz o pedido mas não vai além
- "Está sempre disponível" → disponibilidade ≠ entrega
- "Eu acho que..." sem dado → máximo 3 em Foco em Fatos e Dados
- "Antes era melhor" → red flag Adaptabilidade
- "Não é minha área" → red flag Atitude de Dono e Colaboração
- "Já tentei mas não deu" → aprofundar: tentou uma vez ou de verdade?

ESCALA POR CRITÉRIO (exemplos do CEO):

1. SANGUE NO OLHO — "ir além, não aceitar bom o suficiente, garantir o resultado"
- Nota 1: Para no primeiro obstáculo. Não comunica, não busca alternativa. Fica esperando
- Nota 2: Faz o mínimo pedido. Comunica problema mas não propõe solução. Precisa de acompanhamento constante
- Nota 3: Entrega com qualidade. Resolve ou escala obstáculos adequadamente. Cumpre prazos
- Nota 4: Além de entregar, MELHORA o processo. Identifica problemas que ninguém viu e resolve proativamente
- Nota 5: TRANSFORMA a área. Cria algo que ninguém imaginou ser possível. Ex: não-técnico que construiu sistema 3D usando IA
- ERRO: Não confundir "muitas horas" com Sangue no Olho. Horas extras sem entrega = problema de produtividade

2. ATITUDE DE DONO — "tratar problema da empresa como se fosse seu"
- Nota 1: Faz só o que mandam. "Mas eu fiz o que pediram". Não se sente responsável pelo resultado
- Nota 2: Faz a parte dela mas não olha pro todo. "QA é com outro time"
- Nota 3: Cuida do escopo e um pouco além. Percebe problema adjacente e comunica
- Nota 4: Resolve problemas que NÃO são formalmente seus porque impactam o resultado
- Nota 5: Muda a trajetória da empresa por agir como dona. Implementa solução sem ninguém pedir
- ERRO: Não confundir "faz tudo sozinho" com Atitude de Dono. Centralizar e virar gargalo é o oposto

3. FOCO EM FATOS E DADOS — "decidir com base no mensurável, não no que parece"
- Nota 1: Decide por achismo. "Eu acho". Não busca dados antes de concluir
- Nota 2: Usa dados quando cobrado, não espontaneamente. Não sabe explicar variações nos números
- Nota 3: Fundamenta decisões com dados consistentemente. Sabe onde buscar, apresenta com clareza
- Nota 4: Constrói indicadores NOVOS. Automatiza coleta. Cria dashboards que substituem processos manuais
- Nota 5: Muda a forma como a empresa toma decisão. Implementa sistema data-driven transformador
- ERRO: "Cita números" ≠ "usa dados". Dado sem contexto é decoração. O dado influenciou a decisão ou foi enfeite?

4. PRIORIZE E SIMPLIFIQUE — "fazer primeiro o que importa, do jeito mais simples que funcione"
- Nota 1: Faz tudo ao mesmo tempo sem terminar nada. Ou complica tarefa simples
- Nota 2: Prioriza quando cobrado, sozinho se perde. Gasta tempo em formatação quando o dado não está pronto
- Nota 3: Entrega o essencial no prazo. Diferencia urgente de importante. Não complica
- Nota 4: SIMPLIFICA ativamente. Elimina etapas desnecessárias com resultado mensurável
- Nota 5: Transforma a operação. Migra processo manual para automação com IA
- ERRO: "Faz pouco" ≠ "simplifica". Simplificar é mesmo resultado com menos esforço. "Ser rápido" sem critério ≠ priorizar

5. ESCOPO DA FUNÇÃO — "entregar no nível que o cargo exige"
- Nota 1: Não entrega o básico. Coordenador que não coordena, analista que precisa ser lembrado toda semana
- Nota 2: Entrega parcialmente. Gerente que gerencia tarefas mas não gerencia pessoas
- Nota 3: Atua plenamente no escopo. Entende papel, entrega, não invade nem negligencia
- Nota 4: Demonstra maturidade do nível ACIMA. Se preparando naturalmente para promoção
- Nota 5: Define o padrão do que o cargo deveria ser. Já atua como se estivesse no próximo nível
- ERRO: Não penalizar quem faz mais — pode ser potencial. Problema é quando faz o que não é dela E deixa de fazer o que é

6. ENTREGAS DE VALOR — "resultado que move o ponteiro do negócio"
- Nota 1: Não entrega ou entrega sem impacto. Reunião e e-mail não são entrega
- Nota 2: Entrega abaixo do esperado para o nível. Time entrega mas não o suficiente
- Nota 3: Entregas consistentes e alinhadas. Resultado mensurável para o nível
- Nota 4: Supera expectativa. Identifica e implementa melhoria além do escopo do quarter
- Nota 5: Redefine o padrão. Constrói algo que elimina trabalho manual e escala
- ERRO: "Estar ocupado" ≠ entregar valor. Para gestão, a entrega é o resultado do TIME, não tarefa pessoal

7. CONSISTÊNCIA — "entregar sempre, não só quando motivado"
- Nota 1: Desempenho imprevisível. "Desaparece" em semanas. Falta em dailies sem justificativa
- Nota 2: Oscila. Bate meta num mês, 30% no seguinte sem causa externa
- Nota 3: Estável. Entrega no padrão de forma contínua, sem picos nem vales
- Nota 4: Consistente E melhora gradualmente. Curva ascendente estável
- Nota 5: Define o ritmo da área. Mantém operação perfeita durante reestruturação
- ERRO: "Tempo de empresa" ≠ consistência. 5 anos por inércia = acomodação, não consistência

8. PENSAR FORA DA CAIXA — "não aceitar que as coisas precisam ser como sempre foram"
- Nota 1: Nunca questiona, nunca propõe alternativa. Faz do jeito que mandaram
- Nota 2: Tenta pensar diferente mas superficialmente. "Vamos usar IA" sem proposta concreta
- Nota 3: Traz ideias viáveis quando encontra problema. Protótipo, sugestão com teste
- Nota 4: Implementa soluções criativas que mudam o jogo da área
- Nota 5: Cria algo que ninguém imaginou ser possível. Inovação disruptiva com implementação
- ERRO: "Ter ideias" ≠ pensar fora da caixa. Ideia sem execução é conversa. Criatividade sem operação é distração

9. ORGANIZAÇÃO — "saber o que fazer, quando, e estar no controle"
- Nota 1: Perde prazo, esquece tarefa. Backlog sem prioridade, sem responsável, sem prazo
- Nota 2: Se organiza parcialmente. Algumas coisas no sistema, outras na cabeça. Perde fio na 3ª semana
- Nota 3: Organizado de forma funcional. Sistema próprio que funciona, entregas no prazo
- Nota 4: Organiza a si e ao entorno. Implementa sistema que o time adota
- Nota 5: Cria infraestrutura de organização que escala. Auditoria automatizada
- ERRO: "Muitas ferramentas" ≠ organizado. 5 apps sem saber a prioridade = desorganizado com estilo

10. ADAPTABILIDADE — "adotar a nova realidade e performar nela"
- Nota 1: Resiste ativamente. Sabota novas diretrizes. "Eu não preciso disso" (ex: recusa usar IA)
- Nota 2: Aceita mas não se adapta de verdade. Faz o mínimo pra parecer que está aderindo
- Nota 3: Se adapta dentro de prazo razoável. Quando diretriz muda, ajusta
- Nota 4: Se adapta rápido E ajuda outros. Aprende sozinho, cria tutorial, vira referência
- Nota 5: Transforma mudança em vantagem competitiva. Propõe novo modelo que a empresa adota
- ERRO: "Não reclamar" ≠ adaptável. Aceitar calada mas não mudar comportamento = passiva, não adaptável

11. COMUNICAÇÃO — "direta, clara, sem rodeio"
- Nota 1: Não comunica. Silêncio com problema. Sabia que ia atrasar e não falou até a data
- Nota 2: Comunica de forma confusa ou tardia. Slack de 20 linhas sem conclusão clara
- Nota 3: Clara e no timing certo. Problema com contexto e proposta de solução
- Nota 4: Antecipa necessidade de informação. Preview antes da reunião, pontos de atenção destacados
- Nota 5: Transforma cultura de comunicação. Elimina reuniões com sistema assíncrono eficiente
- ERRO: "Fala muito" ≠ comunica bem. Informalidade é OK. Silêncio sobre bloqueios = nota 1

12. COLABORAÇÃO — "trabalhar pelo resultado da empresa, não da sua caixinha"
- Nota 1: Não colabora ou sabota. Protege informação, cria feudos
- Nota 2: Colabora quando obrigado, com má vontade. Entrega tarde e com qualidade inferior
- Nota 3: Colabora profissionalmente. Ajuda quando pedido, não cria atrito
- Nota 4: Colabora proativamente. Vai até o outro time ajudar sem ninguém pedir
- Nota 5: Constrói pontes que mudam a empresa. Rituais cross-BU que reduzem retrabalho
- ERRO: "Ser simpático" ≠ colaborar. Discordância construtiva é mais valiosa que concordância passiva

13. USO DE IA — "AI-First. IA não é opcional. É critério de permanência"
- Nota 1: Não usa. Resistência ativa. Uso zero após 3 meses com licença = deal breaker
- Nota 2: Usa superficialmente. ChatGPT pra reescrever e-mail. "Fica curioso" sem testar
- Nota 3: Usa como ferramenta DIÁRIA. Economiza 2-3h/dia consistentemente
- Nota 4: CRIA com IA. Automação que substitui processo manual. Agente que roda sozinho
- Nota 5: TRANSFORMA operação com IA. Faz em 1 dia o que TI não entregou em 2 anos
- ERRO: "Uso ChatGPT" sem mudança real = nota 2. Perguntar: "o que MUDOU no seu processo?". Entusiasmo sem implementação = nota 2

RÉGUA DE AUTONOMIA (aplique em TODA nota):
- Faz bem MAS líder precisa cobrar/lembrar → tende a 2
- Faz bem E é autônomo → tende a 3
- Faz bem, autônomo, E PROPÕE soluções/melhorias → tende a 4
- Faz bem, autônomo, LIDERA resolução, E eleva outros → tende a 5`;

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

    if (body.employeeMedals && body.employeeMedals.length > 0) {
      holisticContext += `\n\nMEDALHAS DE HONRA RECEBIDAS (${body.employeeMedals.length}):\n${body.employeeMedals.map((m, i) => `  ${i + 1}. ${m}`).join("\n")}`;
      holisticContext += `\n\nUse as medalhas como EVIDÊNCIA ADICIONAL ao avaliar consistência. Se as medalhas corroboram os conceitos dados, mencione isso. Se contradizem (ex: medalha de "Sangue no olho" mas conceito E nesse critério), questione.`;
    }

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

// ── RESPONSE CACHE (in-memory, short-lived) ──

const responseCache = new Map<string, { content: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(body: ChatRequest): string | null {
  // Only cache holistic mode (same input = same output)
  if (body.mode !== "holistic") return null;
  const key = JSON.stringify({
    mode: body.mode,
    employeeName: body.employeeName,
    evaluationType: body.evaluationType,
    allAnswers: body.allAnswers?.map((a) => ({ id: a.questionId, score: a.score, j: a.justification })),
  });
  return key;
}

function getFromCache(key: string): string | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    responseCache.delete(key);
    return null;
  }
  return entry.content;
}

function setCache(key: string, content: string) {
  responseCache.set(key, { content, timestamp: Date.now() });
  // Evict old entries if cache grows too large
  if (responseCache.size > 500) {
    const now = Date.now();
    for (const [k, v] of responseCache) {
      if (now - v.timestamp > CACHE_TTL) responseCache.delete(k);
    }
  }
}

// ── API HANDLER ──

export async function POST(req: NextRequest) {
  const body: ChatRequest = await req.json();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === "sua-chave-aqui") {
    return fallbackResponse(body);
  }

  // Check cache first
  const cacheKey = getCacheKey(body);
  if (cacheKey) {
    const cached = getFromCache(cacheKey);
    if (cached) {
      return NextResponse.json({ content: cached });
    }
  }

  // Acquire rate-limit slot
  const acquired = await acquireSlot();
  if (!acquired) {
    return NextResponse.json(
      { content: "O sistema está com muitos acessos no momento. Aguarde alguns segundos e tente novamente." },
      { status: 429 }
    );
  }

  try {
    const { systemPrompt, messages } = buildMessages(body);

    // Use streaming to avoid serverless function timeout
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
        stream: true,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      console.error("Anthropic API error:", response.status);
      releaseSlot();

      // Rate limited by Anthropic — tell user to wait
      if (response.status === 429) {
        return NextResponse.json(
          { content: "A IA está temporariamente sobrecarregada. Aguarde 10 segundos e tente novamente." },
          { status: 429 }
        );
      }

      return fallbackResponse(body);
    }

    // Stream the response back to the client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const jsonStr = line.slice(6).trim();
                if (jsonStr === "[DONE]") continue;

                try {
                  const event = JSON.parse(jsonStr);

                  if (event.type === "content_block_delta" && event.delta?.text) {
                    fullContent += event.delta.text;
                    // Send SSE chunk to client
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ delta: event.delta.text })}\n\n`)
                    );
                  }

                  if (event.type === "message_stop") {
                    // Cache the complete response if applicable
                    if (cacheKey && fullContent) {
                      setCache(cacheKey, fullContent);
                    }
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ done: true, content: fullContent })}\n\n`)
                    );
                  }
                } catch {
                  // Skip unparseable lines
                }
              }
            }
          }

          // If stream ended without message_stop, send final content
          if (fullContent && !fullContent.endsWith("[DONE]")) {
            if (cacheKey) setCache(cacheKey, fullContent);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ done: true, content: fullContent })}\n\n`)
            );
          }
        } catch (err) {
          console.error("Stream processing error:", err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: true, content: fullContent || "Erro ao processar resposta da IA." })}\n\n`)
          );
        } finally {
          releaseSlot();
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    releaseSlot();
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
