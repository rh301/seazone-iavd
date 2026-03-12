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

interface ChatRequest {
  question: {
    title: string;
    description: string;
    scale: ScaleLevel[];
  };
  score: number;
  scaleLevel: ScaleLevel;
  employeeName: string;
  justification: string;
  chatHistory: ChatMessage[];
}

const SYSTEM_PROMPT = `Você é o Assistente de Calibragem da Seazone, integrado à plataforma AVD Insight (Avaliação de Desempenho).

Seu papel é ajudar gestores a atribuírem notas mais justas e alinhadas com a interpretação da diretoria para cada critério de avaliação.

Regras de comportamento:
- Sempre se baseie na escala e interpretação da diretoria fornecidas no contexto
- Peça exemplos concretos e recentes para validar a nota escolhida
- Se a nota parecer inconsistente com os exemplos dados, questione gentilmente
- Sugira ajustes quando a frequência do comportamento não corresponder ao nível da nota
- Nunca imponha uma nota — apenas oriente a reflexão
- Seja conciso, direto e empático
- Use negrito (**texto**) para destacar notas e labels
- Use citações (> texto) para referenciar descrições da escala
- Responda sempre em português (pt-BR)
- Limite suas respostas a no máximo 200 palavras`;

function buildMessages(body: ChatRequest) {
  const { question, score, scaleLevel, employeeName, chatHistory } = body;

  const context = `CONTEXTO DA AVALIAÇÃO:
- Colaborador avaliado: ${employeeName}
- Critério: "${question.title}" — ${question.description}
- Nota atribuída pelo gestor: ${score} (${scaleLevel.label})
- Descrição da nota (visão da diretoria): "${scaleLevel.description}"
- Exemplos esperados pela diretoria para essa nota:
${scaleLevel.examples.map((e) => `  • ${e}`).join("\n")}

ESCALA COMPLETA (interpretação da diretoria):
${question.scale.map((s) => `  Nota ${s.score} (${s.label}): ${s.description}`).join("\n")}`;

  const messages: { role: "user" | "assistant"; content: string }[] = [
    { role: "user", content: context },
  ];

  for (const msg of chatHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  return messages;
}

export async function POST(req: NextRequest) {
  const body: ChatRequest = await req.json();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Fallback para respostas locais se não houver API key configurada
  if (!apiKey || apiKey === "sua-chave-aqui") {
    return fallbackResponse(body);
  }

  try {
    const messages = buildMessages(body);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        system: SYSTEM_PROMPT,
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

// Respostas rule-based como fallback
function fallbackResponse(body: ChatRequest) {
  const { question, score, scaleLevel, employeeName, chatHistory } = body;

  const userMessages = chatHistory.filter((m) => m.role === "user");
  const lastUserMsg = userMessages[userMessages.length - 1]?.content?.toLowerCase() || "";
  const userMsgCount = userMessages.length;

  const lower = question.scale.find((s) => s.score === score - 1);
  const higher = question.scale.find((s) => s.score === score + 1);

  let response = "";

  if (userMsgCount <= 1) {
    if (score >= 4) {
      response =
        `Você atribuiu nota **${score} (${scaleLevel.label})** para **${employeeName}** em "${question.title}".\n\n` +
        `Segundo a interpretação da diretoria, essa nota significa:\n` +
        `> "${scaleLevel.description}"\n\n` +
        `Para validar essa avaliação, poderia compartilhar **um exemplo concreto e recente** em que ${employeeName} demonstrou esse nível?\n\n` +
        `A diretoria espera comportamentos como:\n` +
        scaleLevel.examples.map((e) => `• ${e}`).join("\n") +
        `\n\nO exemplo que você tem em mente se encaixa nesse perfil?`;
    } else if (score <= 2) {
      response =
        `Você atribuiu nota **${score} (${scaleLevel.label})** para **${employeeName}** em "${question.title}".\n\n` +
        `Essa nota indica uma oportunidade significativa de desenvolvimento. Segundo a diretoria:\n` +
        `> "${scaleLevel.description}"\n\n` +
        `Para que o feedback seja construtivo e acionável, poderia descrever **situações específicas** que levaram a essa avaliação?\n\n` +
        `Também reflita: esse comportamento é **recorrente** ou foi algo pontual? ` +
        (higher
          ? `Se pontual, talvez nota ${higher.score} (${higher.label}) — "${higher.description}" — seja mais representativa.`
          : "");
    } else {
      response =
        `Você atribuiu nota **${score} (${scaleLevel.label})** para **${employeeName}** em "${question.title}".\n\n` +
        `A diretoria interpreta nota ${score} como:\n` +
        `> "${scaleLevel.description}"\n\n` +
        `Vamos validar juntos. Reflita:\n` +
        (higher
          ? `• ${employeeName} poderia estar mais próximo de nota **${higher.score} (${higher.label})**: "${higher.description}"?\n`
          : "") +
        (lower
          ? `• Ou seria mais próximo de nota **${lower.score} (${lower.label})**: "${lower.description}"?\n`
          : "") +
        `\nCompartilhe **exemplos concretos** para que possamos alinhar.`;
    }
  } else if (userMsgCount === 2) {
    const msgLength = lastUserMsg.length;
    const hasExamples = msgLength > 50;
    const wantsToKeep = /manter|sim|isso|confirmo|concordo|exato/.test(lastUserMsg);
    const wantsToChange = /mudar|alterar|revisar|repensar|talvez/.test(lastUserMsg);

    if (wantsToChange) {
      response =
        `Boa reflexão! Se você está reconsiderando, aqui está um resumo rápido:\n\n` +
        (higher ? `• **Nota ${higher.score} (${higher.label})**: ${higher.description}\n` : "") +
        `• **Nota ${score} (${scaleLevel.label})**: ${scaleLevel.description}\n` +
        (lower ? `• **Nota ${lower.score} (${lower.label})**: ${lower.description}\n` : "") +
        `\nVocê pode selecionar outra nota na escala ao lado. Qual parece mais adequada?`;
    } else if (wantsToKeep && hasExamples) {
      response =
        `Os exemplos que você trouxe parecem consistentes com nota **${score} (${scaleLevel.label})**.\n\n` +
        `Pode registrar sua justificativa e seguir para a próxima pergunta.`;
    } else if (!hasExamples) {
      response =
        `Obrigado pelo contexto! Para um alinhamento mais preciso, seria útil ter **exemplos mais específicos**.\n\n` +
        `A diretoria considera nota ${score} como:\n` +
        scaleLevel.examples.map((e) => `• ${e}`).join("\n") +
        `\n\nVocê consegue citar uma situação recente?`;
    } else {
      response =
        `Obrigado pelos detalhes! O que você descreveu parece consistente com nota **${score} (${scaleLevel.label})**.\n\n` +
        `Você se sente confortável com essa nota ou gostaria de refletir mais?`;
    }
  } else if (userMsgCount === 3) {
    const wantsToKeep = /manter|sim|confort|ok|certo|isso|confirmo|pode ser|tá bom|está bom/.test(lastUserMsg);
    if (wantsToKeep) {
      response =
        `Perfeito! Nota **${score} (${scaleLevel.label})** registrada para ${employeeName}.\n\n` +
        `Preencha a **justificativa** com os exemplos que discutimos e siga para a **próxima pergunta**.`;
    } else {
      response =
        `Sem problemas! Selecione outra nota na escala ao lado.\n\n` +
        question.scale.map((s) => `• **Nota ${s.score} (${s.label})**: ${s.description}`).join("\n") +
        `\n\nEscolha a que melhor representa ${employeeName}.`;
    }
  } else {
    const responses = [
      `Se precisar revisar essa nota depois, pode voltar a qualquer momento. Vamos para a próxima?`,
      `Nota ${score} para "${question.title}" está registrada. Siga para a próxima quando quiser.`,
      `A avaliação de ${employeeName} nesse critério está bem fundamentada. Siga para a próxima quando quiser.`,
    ];
    response = responses[userMsgCount % responses.length];
  }

  return NextResponse.json({ content: response });
}
