import { NextRequest, NextResponse } from "next/server";
import { acquireSlot, releaseSlot } from "@/lib/rate-limiter";

interface HelpRequest {
  message: string;
  chatHistory: { role: "user" | "assistant"; content: string }[];
  userName: string;
}

const SYSTEM_PROMPT = `Você é o assistente da plataforma IAVD (Avaliação de Desempenho com IA) da Seazone.

Seu papel é tirar dúvidas dos colaboradores sobre o processo de avaliação. Seja direto e amigável.

SOBRE A PLATAFORMA:
- Avaliação 360: cada pessoa é avaliada por si mesma (autoavaliação), seu gestor, 2 pares e seus liderados
- São 10 perguntas baseadas em 5 valores Seazone: Sangue no Olho, Foco em Fatos e Dados, Priorize e Simplifique, Proatividade, AI First
- A IA conversa com o avaliador para investigar exemplos concretos e depois sugere uma nota de 1 a 5
- Nota 3 é o esperado (bom). Nota 4-5 são raras e exigem evidências fortes
- Após todas as avaliações, o RH faz a revisão e libera as notas

SOBRE AS NOTAS:
- 1 = comportamento não demonstrado
- 2 = demonstrado raramente, depende do líder
- 3 = comportamento consistente esperado (a maioria é 3)
- 4 = acima da média, proativo e autônomo
- 5 = excepcional, impacto no time/empresa

DÚVIDAS COMUNS:
- "Quem me avalia?" → Seu gestor, você mesmo, 2 pares e seus liderados (se tiver)
- "Posso ver minhas notas?" → Sim, na aba "Minhas Notas", após o RH liberar
- "O que são pares?" → Colegas do mesmo nível: se você é coordenador, seus pares são outros coordenadores de equipes irmãs. Se é analista, são os outros analistas da sua equipe
- "A IA decide minha nota?" → A IA sugere, mas o RH revisa antes de liberar
- "Posso contestar?" → Sim, durante a avaliação você pode contestar a nota da IA com novos exemplos
- "Quando as notas são liberadas?" → Após a revisão do RH. Você será notificado

REGRAS:
- Responda em português (pt-BR)
- Seja conciso (máximo 80 palavras)
- Se não souber, diga "Fale com o RH para essa dúvida"
- Não invente informações
- Seja empático e acolhedor`;

export async function POST(req: NextRequest) {
  const body: HelpRequest = await req.json();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === "sua-chave-aqui") {
    return fallbackResponse(body);
  }

  const acquired = await acquireSlot();
  if (!acquired) {
    return fallbackResponse(body); // Graceful fallback instead of error
  }

  try {
    const messages = body.chatHistory.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      return fallbackResponse(body);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "Desculpe, não consegui responder.";
    return NextResponse.json({ content });
  } catch {
    return fallbackResponse(body);
  } finally {
    releaseSlot();
  }
}

function fallbackResponse(body: HelpRequest) {
  const msg = body.message.toLowerCase();

  if (msg.includes("quem") && (msg.includes("avalia") || msg.includes("avaliar"))) {
    return NextResponse.json({
      content: "Você é avaliado por **4 perspectivas**: seu gestor, você mesmo (autoavaliação), 2 pares da sua equipe/nível e seus liderados (se tiver). Isso garante uma visão completa do seu desempenho.",
    });
  }

  if (msg.includes("nota") && (msg.includes("funciona") || msg.includes("como"))) {
    return NextResponse.json({
      content: "As notas vão de **1 a 5**. A maioria das pessoas é **nota 3** (dentro do esperado — isso é bom!). Nota 4 exige evidências de proatividade e autonomia. Nota 5 é excepcional e rara. A IA sugere a nota, mas o RH revisa antes de liberar.",
    });
  }

  if (msg.includes("par") || msg.includes("pares")) {
    return NextResponse.json({
      content: "**Pares** são colegas do mesmo nível. Se você é coordenador, seus pares são outros coordenadores de equipes irmãs. Se é analista, são os outros analistas da sua equipe. Cada pessoa avalia 2 pares.",
    });
  }

  if (msg.includes("contestar") || msg.includes("discordar")) {
    return NextResponse.json({
      content: "Sim! Durante a avaliação, depois que a IA dar a nota, você pode **contestar** trazendo novos exemplos concretos. A IA reavalia se os argumentos forem fortes.",
    });
  }

  if (msg.includes("quando") && msg.includes("nota")) {
    return NextResponse.json({
      content: "As notas ficam disponíveis na aba **\"Minhas Notas\"** depois que o RH concluir a revisão e liberar. Você será notificado!",
    });
  }

  if (msg.includes("valor") || msg.includes("critério") || msg.includes("pergunta")) {
    return NextResponse.json({
      content: "São **10 perguntas** em 5 valores Seazone:\n• **Sangue no Olho** — resiliência e comprometimento\n• **Foco em Fatos e Dados** — decisões baseadas em evidências\n• **Priorize e Simplifique** — foco e simplicidade\n• **Proatividade** — antecipação e melhoria\n• **AI First** — uso e disseminação de IA",
    });
  }

  return NextResponse.json({
    content: `Boa pergunta! Se quiser, posso te ajudar com:\n• **Quem me avalia?**\n• **Como funciona a nota?**\n• **O que são pares?**\n• **Posso contestar?**\n\nOu fale com o RH para dúvidas mais específicas.`,
  });
}
