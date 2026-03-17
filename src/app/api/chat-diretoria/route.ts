import { NextRequest, NextResponse } from "next/server";

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

interface DirectorChatRequest {
  question: {
    title: string;
    description: string;
    category: string;
    scale: ScaleLevel[];
  };
  chatHistory: ChatMessage[];
  mode: "explore" | "summarize";
  existingInsights?: string;
}

const EXPLORE_PROMPT = `Você é o Calibrador de AVD da Seazone. Sua função é alinhar com a diretoria o que cada nota significa nesse valor.

ABORDAGEM:
Você APRESENTA o que entende de cada nota e pede pro diretor validar. Se ele concordar, avança. Se discordar, você pede exemplo de bom e ruim e vai ajustando.

ESTILO:
- Fale como colega, direto ao ponto
- Máximo 80 palavras por mensagem
- Use **negrito** nos pontos-chave

ROTEIRO (uma nota por vez):

1. Comece pela nota 3 — apresente o que você entende como esperado:
"Pra mim, **nota 3** nesse valor significa [sua interpretação baseada na escala]. Concorda ou vê diferente?"

2. Se concordar → avance pra nota 4
   Se discordar → "Entendi. Me dá um exemplo de alguém que pra você é 3 aqui. E um que NÃO é 3."

3. Nota 4 — apresente o diferencial:
"Pra mim o salto do 3 pro **4** é [interpretação]. O 4 faz X que o 3 não faz. Bate com o que você pensa?"

4. Se concordar → avance pra nota 5
   Se discordar → peça exemplo de 4 e de "quase 4 mas não é"

5. Nota 5 — apresente o excepcional:
"**Nota 5** pra mim é [interpretação]. Impacto no time, referência. Concorda?"

6. Nota 2:
"**Nota 2** pra mim é quem tenta mas depende muito do líder. Faz sentido?"

7. Nota 1:
"**Nota 1** seria ausência total — não demonstra o comportamento. Correto?"

8. Fechamento:
"Última coisa: tem alguma situação que a IA poderia errar a nota nesse valor? Algum caso que parece 4 mas na real é 3?"

REGRAS:
- SEMPRE apresente sua interpretação PRIMEIRO, depois pergunte
- Se o diretor concordar rápido ("sim", "isso", "concordo"), avance direto pra próxima nota
- Se discordar, peça UM exemplo bom e UM ruim antes de avançar
- Conecte: "Você disse que X é 3. Então se alguém faz X mas precisa de ajuda, seria 2?"
- Responda em português (pt-BR)`;

const SUMMARIZE_PROMPT = `Você é o Consultor de Calibragem da Seazone. Com base em TODA a conversa anterior com o diretor, gere um RESUMO ESTRUTURADO das regras de avaliação.

FORMATO OBRIGATÓRIO:

**Valor: [nome do valor]**
**Pergunta: [pergunta avaliada]**

**Nota 1 — [label]**
Sinais: [lista de comportamentos/palavras que indicam nota 1]
Exemplo típico: [resumo do exemplo dado pelo diretor, se houver]

**Nota 2 — [label]**
Sinais: [lista]
Diferença para nota 1: [o que muda]
Exemplo típico: [resumo]

**Nota 3 — [label] (padrão esperado)**
Sinais: [lista]
Diferença para nota 2: [o que muda]
Exemplo típico: [resumo]

**Nota 4 — [label]**
Sinais: [lista]
Diferença para nota 3: [o que muda — este é o salto CRÍTICO]
Exemplo típico: [resumo]

**Nota 5 — [label]**
Sinais: [lista]
Diferença para nota 4: [o que muda]
Exemplo típico: [resumo]

**Erros comuns da IA:**
- [lista de erros que o diretor mencionou ou que ficam implícitos]

**Regra de ouro:**
[Uma frase que resume o critério principal desse valor segundo o diretor]

REGRAS:
- Use APENAS informações da conversa. Não invente.
- Se o diretor não cobriu algum nível, escreva: "Não discutido — usar escala padrão"
- Seja objetivo e direto
- Responda em português (pt-BR)`;

function buildMessages(body: DirectorChatRequest) {
  const { question, chatHistory, mode, existingInsights } = body;

  const systemPrompt = mode === "summarize" ? SUMMARIZE_PROMPT : EXPLORE_PROMPT;

  let context = `VALOR SEAZONE: "${question.category}"
PERGUNTA: "${question.title}" — ${question.description}

ESCALA ATUAL:
${question.scale.map((s) => `  Nota ${s.score} (${s.label}): ${s.description}\n    Exemplos: ${s.examples.join("; ")}`).join("\n")}`;

  if (existingInsights) {
    context += `\n\nINTERPRETAÇÃO ATUAL DA DIRETORIA (já salva):\n${existingInsights}`;
  }

  const messages: { role: "user" | "assistant"; content: string }[] = [
    { role: "user", content: context },
  ];

  for (const msg of chatHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // If explore mode and no chat yet, add initial prompt
  if (mode === "explore" && chatHistory.length === 0) {
    messages.push({
      role: "user",
      content: "Vamos começar. Me ajude a definir os critérios de avaliação para esse valor.",
    });
  }

  if (mode === "summarize") {
    messages.push({
      role: "user",
      content: "Gere o resumo estruturado das regras que discutimos.",
    });
  }

  return { systemPrompt, messages };
}

export async function POST(req: NextRequest) {
  const body: DirectorChatRequest = await req.json();
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
        max_tokens: body.mode === "summarize" ? 1500 : 600,
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
    console.error("Chat Diretoria API error:", error);
    return fallbackResponse(body);
  }
}

function fallbackResponse(body: DirectorChatRequest) {
  const { question, chatHistory, mode } = body;
  const msgCount = chatHistory.filter((m) => m.role === "user").length;

  if (mode === "summarize") {
    return NextResponse.json({
      content:
        `**Valor: ${question.category}**\n` +
        `**Pergunta: ${question.title}**\n\n` +
        `Com base na conversa, os critérios discutidos foram:\n\n` +
        `**Nota 3 (padrão):** Comportamento esperado para a posição\n` +
        `**Nota 4:** Evidência de proatividade e autonomia acima do esperado\n` +
        `**Nota 5:** Impacto no time/organização com liderança clara\n\n` +
        `_Para um resumo mais detalhado, configure a chave da API Anthropic._`,
    });
  }

  // Explore mode
  const scale3 = question.scale.find((s) => s.score === 3);
  const scale4 = question.scale.find((s) => s.score === 4);
  const scale5 = question.scale.find((s) => s.score === 5);

  const questions = [
    `Vamos alinhar **"${question.title}"** (${question.category}).\n\nPra mim, **nota 3** aqui significa: ${scale3?.description || "comportamento esperado para a posição"}.\n\n**Concorda ou vê diferente?**`,
    `Entendi. Agora o salto pro **4**: pra mim o diferencial é ${scale4?.description || "ir além do esperado com autonomia"}.\n\nO **4 faz algo que o 3 não faz**. Bate com o que você pensa?`,
    `E **nota 5** — pra mim seria: ${scale5?.description || "referência na empresa, impacto no time"}.\n\n**Concorda?**`,
    `Agora o outro lado: **nota 2** pra mim é quem tenta mas **depende muito do líder** pra conseguir. Faz sentido?`,
    `E **nota 1** — ausência total do comportamento, postura que vai contra o valor. **Correto?**`,
    `Última coisa: tem alguma situação que a IA poderia **errar a nota** nesse valor? Algum caso que **parece 4 mas na real é 3**?`,
    `Show, temos bastante material. Clica em **"Gerar resumo"** que eu organizo tudo.`,
  ];

  const idx = Math.min(msgCount, questions.length - 1);
  return NextResponse.json({ content: questions[idx] });
}
