"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { MessageCircleQuestion, Send, X, Bot, User } from "lucide-react";
import { formatChatContent } from "@/lib/format-chat";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_CONTEXT = `Você é o assistente da plataforma IAVD (Avaliação de Desempenho com IA) da Seazone.

Seu papel é tirar dúvidas dos colaboradores sobre o processo de avaliação. Seja direto e amigável.

SOBRE A PLATAFORMA:
- Avaliação 360: cada pessoa é avaliada por si mesma (autoavaliação), seu gestor, 2 pares e seus liderados
- São 10 perguntas baseadas em 5 valores Seazone: Sangue no Olho, Foco em Fatos e Dados, Priorize e Simplifique, Proatividade, AI First
- A IA conversa com o avaliador para investigar exemplos concretos e depois sugere uma nota de 1 a 5
- Nota 3 é o esperado (bom). Nota 4-5 são raras e exigem evidências fortes
- Após todas as avaliações, o RH revisa e libera as notas

SOBRE AS NOTAS:
- 1 = comportamento não demonstrado
- 2 = demonstrado raramente, depende do líder
- 3 = comportamento consistente esperado (a maioria é 3)
- 4 = acima da média, proativo e autônomo
- 5 = excepcional, impacto no time/empresa

DÚVIDAS COMUNS:
- "Quem me avalia?" → Seu gestor, você mesmo, 2 pares e seus liderados (se tiver)
- "Posso ver minhas notas?" → Sim, na aba "Minhas Notas", após o RH liberar
- "O que são pares?" → Colegas do mesmo nível na sua equipe ou coordenadores de equipes irmãs
- "A IA decide minha nota?" → A IA sugere, mas o RH revisa antes de liberar
- "Posso contestar?" → Sim, durante a avaliação você pode contestar a nota da IA com novos exemplos

REGRAS:
- Responda em português (pt-BR)
- Seja conciso (máximo 100 palavras)
- Se não souber, diga "Fale com o RH para essa dúvida"
- Não invente informações sobre a empresa
- Seja empático e acolhedor`;

export default function HelpChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user) return null;

  async function handleSend() {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMsg = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: input.trim(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

      // Try API, fallback to rule-based
      const res = await fetch("/api/chat-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          chatHistory: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userName: user!.name,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_ai`,
          role: "assistant",
          content: data.content,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_ai`,
          role: "assistant",
          content: "Desculpe, tive um erro. Tente novamente ou fale com o RH.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition flex items-center justify-center z-50"
          title="Tirar dúvidas"
        >
          <MessageCircleQuestion className="w-6 h-6" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-white p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <h3 className="text-sm font-semibold">Dúvidas sobre a AVD</h3>
                <p className="text-xs text-white/70">Pergunte qualquer coisa</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <MessageCircleQuestion className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Olá, {user.name.split(" ")[0]}!
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Pergunte sobre o processo de avaliação
                </p>
                <div className="mt-4 space-y-2">
                  {[
                    "Quem me avalia?",
                    "Como funciona a nota?",
                    "O que são pares?",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q);
                      }}
                      className="block w-full text-xs text-primary bg-primary/5 hover:bg-primary/10 rounded-lg px-3 py-2 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "assistant" ? "bg-primary/10" : "bg-gray-100"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="w-3 h-3 text-primary" />
                  ) : (
                    <User className="w-3 h-3 text-gray-500" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    msg.role === "assistant"
                      ? "bg-gray-50 text-gray-800"
                      : "bg-primary text-white"
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: formatChatContent(msg.content),
                  }}
                />
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-gray-50 px-3 py-2 rounded-xl">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Digite sua dúvida..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="px-3 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition disabled:opacity-30"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
