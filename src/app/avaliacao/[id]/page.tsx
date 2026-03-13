"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { Question, Evaluation, ChatMessage, Answer } from "@/lib/types";
import { getQuestions, getEvaluation, saveEvaluation, getInsightsForQuestion } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { roleLabels } from "@/lib/auth-types";
import { users as allUsers } from "@/data/users";
import AppShell from "@/components/app-shell";
import { formatChatContent } from "@/lib/format-chat";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  Lock,
  Save,
} from "lucide-react";

// Palavras que indicam que o gestor confirmou/entendeu a análise da IA
const CONFIRM_PATTERNS = /\b(entendi|entendo|ok|certo|combinado|concordo|confirmo|pode ser|tá bom|está bom|beleza|perfeito|sim|quero continuar|vamos|próxima|seguir|de acordo|compreendi|fechado)\b/i;

export default function AvaliacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const eval_ = getEvaluation(id);
    if (!eval_) {
      router.push("/avaliacao");
      return;
    }
    if (currentUser && eval_.evaluatorId !== currentUser.id) {
      router.push("/");
      return;
    }
    setEvaluation(eval_);
    setQuestions(getQuestions());
  }, [id, router, currentUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [evaluation?.answers[currentIndex]?.chatHistory]);

  if (!evaluation || !currentUser) return null;

  const employee = allUsers.find((e) => e.id === evaluation.employeeId);
  const question = questions[currentIndex];
  const answer = evaluation.answers[currentIndex];

  if (!question || !answer) return null;

  // === Estado derivado ===
  const isNonStandard = answer.score !== null && answer.score !== 3;
  const hasChat = answer.chatHistory && answer.chatHistory.length > 0;
  const isApproved = isAnswerApproved(answer);
  const canAdvance = answer.score === null || answer.score === 3 || isApproved;

  function updateAnswer(updates: Partial<Answer>) {
    setEvaluation((prev) => {
      if (!prev) return prev;
      const newAnswers = [...prev.answers];
      newAnswers[currentIndex] = { ...newAnswers[currentIndex], ...updates };
      const updated = { ...prev, answers: newAnswers };
      saveEvaluation(updated);
      return updated;
    });
  }

  // Verifica se a resposta foi aprovada pela IA (gestor discutiu e depois confirmou)
  function isAnswerApproved(a: Answer): boolean {
    if (!a.score || a.score === 3) return true;
    if (!a.chatHistory || a.chatHistory.length < 4) return false;

    // Fluxo mínimo exigido:
    // 1. Gestor envia justificativa (user msg)
    // 2. IA analisa e questiona (assistant msg)
    // 3. Gestor responde substancialmente (user msg — NÃO pode ser só "ok")
    // 4. IA reage à resposta (assistant msg)
    // 5. Gestor confirma ("ok", "entendi", etc.) (user msg)

    const aiMessages = a.chatHistory.filter((m) => m.role === "assistant");
    const userMessages = a.chatHistory.filter((m) => m.role === "user");

    // Precisa de pelo menos 2 respostas da IA (análise inicial + reação à resposta)
    if (aiMessages.length < 2) return false;
    // Precisa de pelo menos 3 mensagens do gestor (justificativa + resposta + confirmação)
    if (userMessages.length < 3) return false;

    // A última mensagem do gestor deve ser uma confirmação
    const lastUserMsg = a.chatHistory.filter((m) => m.role === "user").pop();
    const lastAiMsg = a.chatHistory.filter((m) => m.role === "assistant").pop();

    if (!lastUserMsg || !lastAiMsg) return false;

    // O gestor deve ter falado por último
    const lastUserIdx = a.chatHistory.lastIndexOf(lastUserMsg);
    const lastAiIdx = a.chatHistory.lastIndexOf(lastAiMsg);
    if (lastUserIdx < lastAiIdx) return false;

    return CONFIRM_PATTERNS.test(lastUserMsg.content);
  }

  async function fetchAIResponse(history: ChatMessage[], score: number, justification: string) {
    setIsAiTyping(true);
    const scaleLevel = question.scale.find((s) => s.score === score);
    const directorInsights = getInsightsForQuestion(question.id);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          score,
          scaleLevel,
          employeeName: employee?.name || "",
          justification,
          chatHistory: history,
          directorInsights: directorInsights.map((i) => i.interpretation),
        }),
      });

      const data = await res.json();

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      };
      updateAnswer({ chatHistory: [...history, aiMessage] });
    } catch {
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: `Nota ${score} (${scaleLevel?.label}) selecionada para "${question.title}". Compartilhe exemplos concretos que justifiquem essa nota.`,
        timestamp: new Date(),
      };
      updateAnswer({ chatHistory: [...history, aiMessage] });
    } finally {
      setIsAiTyping(false);
    }
  }

  // Seleciona nota — só salva, sem disparar IA
  function handleScoreSelect(score: number) {
    updateAnswer({ score, chatHistory: [], aiValidated: false });
  }

  // Envia justificativa para análise da IA
  function handleSubmitJustification() {
    if (!answer.score || !answer.justification.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: `Minha justificativa para nota ${answer.score} em "${question.title}": "${answer.justification}"`,
      timestamp: new Date(),
    };

    const history = [userMsg];
    updateAnswer({ chatHistory: history });
    fetchAIResponse(history, answer.score, answer.justification);
  }

  // Envia mensagem no chat (resposta à IA)
  async function handleSendMessage() {
    if (!chatInput.trim() || isAiTyping || !answer.score) return;

    const aiMessages = (answer.chatHistory || []).filter((m) => m.role === "assistant");
    const userMessages = (answer.chatHistory || []).filter((m) => m.role === "user");
    const isEarlyConfirm = CONFIRM_PATTERNS.test(chatInput) && (aiMessages.length < 2 || userMessages.length < 2);

    // Se tentou confirmar cedo demais, a IA pede mais detalhes
    if (isEarlyConfirm) {
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "user",
        content: chatInput,
        timestamp: new Date(),
      };
      const aiReply: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content: `Antes de confirmar, preciso que você responda às questões que levantei sobre a nota **${answer.score}**. Traga **exemplos concretos e recentes** que sustentem sua avaliação. Isso é necessário para alinhar com a visão da diretoria.`,
        timestamp: new Date(),
      };
      const newHistory = [...(answer.chatHistory || []), userMessage, aiReply];
      updateAnswer({ chatHistory: newHistory });
      setChatInput("");
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    const newHistory = [...(answer.chatHistory || []), userMessage];
    updateAnswer({ chatHistory: newHistory });
    setChatInput("");

    // Se o gestor confirmou E já teve discussão suficiente, valida
    if (CONFIRM_PATTERNS.test(chatInput)) {
      updateAnswer({ chatHistory: newHistory, aiValidated: true });
      return;
    }

    fetchAIResponse(newHistory, answer.score, answer.justification);
  }

  function handleNavigate(direction: "prev" | "next") {
    const targetIdx = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;

    // Bloqueia avançar se a resposta atual não foi aprovada
    if (direction === "next" && !canAdvance) {
      alert("Você precisa confirmar no chat com a IA antes de avançar. Responda algo como \"entendi\" ou \"ok\" após a análise.");
      return;
    }

    setCurrentIndex(targetIdx);
  }

  function handleFinalize() {
    if (!evaluation) return;
    const allAnswered = evaluation.answers.every((a) => a.score !== null);
    if (!allAnswered) {
      alert("Responda todas as perguntas antes de finalizar.");
      return;
    }
    const pending = evaluation.answers.filter((a) => !isAnswerApproved(a));
    if (pending.length > 0) {
      const names = pending
        .map((a) => {
          const q = questions.find((q) => q.id === a.questionId);
          return q ? `• ${q.title} (nota ${a.score})` : "";
        })
        .filter(Boolean)
        .join("\n");
      alert(
        `As seguintes perguntas precisam da validação da IA antes de finalizar:\n\n${names}\n\nEnvie a justificativa, leia a análise da IA e confirme com "entendi" ou "ok".`
      );
      return;
    }
    const updated = { ...evaluation, status: "concluida" as const };
    saveEvaluation(updated);
    router.push("/historico");
  }

  const progress =
    evaluation.answers.filter((a) => a.score !== null).length / questions.length;

  // Estado visual do chat panel
  const chatState = (() => {
    if (!answer.score) return "empty";
    if (answer.score === 3) return "score3";
    if (!hasChat) return "waiting_justification";
    return "chat_active";
  })();

  return (
    <AppShell>
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/avaliacao")}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Avaliação — {employee?.name}
            </h1>
            <p className="text-sm text-gray-500">
              {employee ? roleLabels[employee.role] : ""} · {employee?.department}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {currentIndex + 1} de {questions.length}
          </div>
          <button
            onClick={handleFinalize}
            className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            Finalizar
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Question navigation pills */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {questions.map((q, i) => {
          const a = evaluation.answers[i];
          const isActive = i === currentIndex;
          const isAnswered = a?.score !== null;
          const approved = isAnswerApproved(a);
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                isActive
                  ? "bg-primary text-white"
                  : approved && isAnswered
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : isAnswered
                  ? "bg-secondary/10 text-secondary border border-secondary/20"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {i + 1}. {q.title.length > 20 ? q.title.slice(0, 20) + "…" : q.title}
              {approved && isAnswered && !isActive && (
                <CheckCircle2 className="w-3 h-3 inline ml-1" />
              )}
              {isAnswered && !approved && !isActive && (
                <Lock className="w-3 h-3 inline ml-1" />
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Question & Score & Justification */}
        <div className="space-y-6">
          {/* Question card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <span className="text-xs font-medium px-2.5 py-1 bg-primary/10 text-primary rounded-full">
              {question.category}
            </span>
            <h2 className="text-lg font-semibold text-gray-900 mt-3">
              {question.title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{question.description}</p>
          </div>

          {/* Score selection */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              1. Selecione a nota
            </h3>
            <div className="space-y-3">
              {question.scale.map((level) => (
                <button
                  key={level.score}
                  onClick={() => handleScoreSelect(level.score)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    answer.score === level.score
                      ? `score-${level.score}-light border-2`
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        answer.score === level.score
                          ? `score-${level.score}`
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {level.score}
                    </span>
                    <div>
                      <span className="font-medium text-gray-800 text-sm">
                        {level.label}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {level.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Justification */}
          {answer.score !== null && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                2. Escreva a justificativa
                {isNonStandard && !isApproved && (
                  <span className="text-xs font-normal text-secondary ml-2">
                    (obrigatória para nota {answer.score})
                  </span>
                )}
              </h3>
              <textarea
                value={answer.justification}
                onChange={(e) => updateAnswer({ justification: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Descreva exemplos concretos que justificam essa nota..."
              />
              {isNonStandard && answer.justification.trim().length > 10 && !hasChat && (
                <button
                  onClick={handleSubmitJustification}
                  disabled={isAiTyping}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm font-medium disabled:opacity-30"
                >
                  <Bot className="w-4 h-4" />
                  Enviar para análise da IA
                </button>
              )}
              {isNonStandard && hasChat && !isApproved && (
                <p className="mt-2 text-xs text-secondary flex items-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  Confirme no chat ao lado para poder avançar
                </p>
              )}
              {isApproved && isNonStandard && (
                <p className="mt-2 text-xs text-accent flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" />
                  Validado pela IA — pode avançar
                </p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => handleNavigate("prev")}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
            <button
              onClick={() => handleNavigate("next")}
              disabled={currentIndex === questions.length - 1}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition disabled:opacity-30 ${
                canAdvance
                  ? "bg-primary text-white hover:bg-primary-dark"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: AI Chat */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-220px)] sticky top-24">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Assistente de Calibragem
                </h3>
                <p className="text-xs text-gray-400">
                  IA alinhada com a visão da diretoria
                </p>
              </div>
            </div>
          </div>

          {chatState === "empty" && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">
                  Selecione uma nota para começar
                </p>
              </div>
            </div>
          )}

          {chatState === "score3" && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 text-accent/30 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">
                  Nota 3 — Dentro do esperado
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Não é necessária validação da IA para nota 3.
                  <br />Preencha a justificativa e avance.
                </p>
              </div>
            </div>
          )}

          {chatState === "waiting_justification" && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <Bot className="w-12 h-12 text-primary/20 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">
                  Nota {answer.score} selecionada
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Escreva a justificativa e clique em
                  <br />&quot;Enviar para análise da IA&quot;
                </p>
              </div>
            </div>
          )}

          {chatState === "chat_active" && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(answer.chatHistory || []).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        msg.role === "assistant"
                          ? "bg-primary/10"
                          : "bg-gray-100"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <Bot className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
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
                {isAiTyping && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="bg-gray-50 px-4 py-3 rounded-2xl">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Feedback visual quando aprovado */}
                {isApproved && (
                  <div className="flex justify-center">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-accent bg-accent/10">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Validado — pode avançar
                    </span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-gray-100">
                {!isApproved && (
                  <p className="text-xs text-gray-400 mb-2">
                    Após ler a análise, responda &quot;entendi&quot;, &quot;ok&quot; ou similar para confirmar
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={isApproved ? "Enviar mensagem adicional..." : "Responda à IA para confirmar..."}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    disabled={isAiTyping}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isAiTyping}
                    className="px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition disabled:opacity-30"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </AppShell>
  );
}
