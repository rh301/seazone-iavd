"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { Question, Evaluation, ChatMessage, Answer, EvaluationType, evaluationTypeLabels, evaluationTypeColors } from "@/lib/types";
import { getQuestions } from "@/lib/store";
import { fetchEvaluation, upsertEvaluation, fetchInsightsForQuestion } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { findUser } from "@/lib/org-tree";
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
  Save,
  Star,
  MessageSquareWarning,
  Scale,
} from "lucide-react";

// Regex para extrair nota do formato "**Nota: X — Label**"
const SCORE_REGEX = /\*\*Nota:\s*(\d)\s*[—–-]\s*(.+?)\*\*/;

function extractScore(content: string): { score: number; label: string } | null {
  const match = content.match(SCORE_REGEX);
  if (match) {
    const score = parseInt(match[1], 10);
    if (score >= 1 && score <= 5) {
      return { score, label: match[2].trim() };
    }
  }
  return null;
}

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
  const [isContesting, setIsContesting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const eval_ = await fetchEvaluation(id);
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
    }
    load();
  }, [id, router, currentUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [evaluation?.answers[currentIndex]?.chatHistory]);

  if (!evaluation || !currentUser) return null;

  const employee = findUser(evaluation.employeeId);
  const evaluationType: EvaluationType = evaluation.evaluationType || "gestor";
  const question = questions[currentIndex];
  const answer = evaluation.answers[currentIndex];

  if (!question || !answer) return null;

  // === Estado derivado ===
  const hasJustification = answer.justification.trim().length > 10;
  const hasChat = answer.chatHistory && answer.chatHistory.length > 0;
  const hasScore = answer.score !== null;
  const isComplete = hasScore && answer.aiValidated;

  // Agrupar perguntas por valor
  const valueGroups = questions.reduce<Record<string, number[]>>((acc, q, i) => {
    if (!acc[q.category]) acc[q.category] = [];
    acc[q.category].push(i);
    return acc;
  }, {});

  function updateAnswer(updates: Partial<Answer>) {
    setEvaluation((prev) => {
      if (!prev) return prev;
      const newAnswers = [...prev.answers];
      newAnswers[currentIndex] = { ...newAnswers[currentIndex], ...updates };
      const updated = { ...prev, answers: newAnswers };
      upsertEvaluation(updated);
      return updated;
    });
  }

  async function fetchAIResponse(
    history: ChatMessage[],
    mode: "discuss" | "score" | "contest"
  ) {
    setIsAiTyping(true);
    const directorInsights = await fetchInsightsForQuestion(question.id);

    // Construir contexto das respostas anteriores
    const previousAnswers = evaluation!.answers
      .filter((a, i) => i !== currentIndex && a.justification.trim().length > 0)
      .map((a, i) => {
        const q = questions.find((q) => q.id === a.questionId);
        return {
          questionTitle: q?.title || "",
          category: q?.category || "",
          justification: a.justification,
          score: a.score,
          aiReasoning: a.aiReasoning,
        };
      });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          employeeName: employee?.name || "",
          justification: answer.justification,
          chatHistory: history,
          directorInsights: directorInsights.map((i) => i.interpretation),
          previousAnswers,
          mode,
          evaluationType,
          evaluatorSector: currentUser?.sector || "",
          evaluateeSector: employee?.sector || "",
          evaluateeCargo: employee?.cargo || "",
        }),
      });

      const data = await res.json();

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      };

      const newHistory = [...history, aiMessage];
      const updates: Partial<Answer> = { chatHistory: newHistory };

      // Se a IA deu nota (mode score ou contest), extrair
      if (mode === "score" || mode === "contest") {
        const extracted = extractScore(data.content);
        if (extracted) {
          updates.score = extracted.score;
          updates.aiValidated = true;
          updates.aiReasoning = data.content;
        }
      }

      updateAnswer(updates);

      if (mode === "contest") {
        setIsContesting(false);
      }
    } catch {
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: "Desculpe, houve um erro ao processar. Tente novamente.",
        timestamp: new Date(),
      };
      updateAnswer({ chatHistory: [...history, aiMessage] });
    } finally {
      setIsAiTyping(false);
    }
  }

  // Gestor envia resposta à pergunta — inicia discussão com IA
  function handleSubmitAnswer() {
    if (!hasJustification) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: answer.justification,
      timestamp: new Date(),
    };

    const history = [userMsg];
    updateAnswer({ chatHistory: history });
    fetchAIResponse(history, "discuss");
  }

  // Envia mensagem no chat (resposta à IA durante discussão)
  async function handleSendMessage() {
    if (!chatInput.trim() || isAiTyping) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    const newHistory = [...(answer.chatHistory || []), userMessage];
    updateAnswer({ chatHistory: newHistory });
    setChatInput("");

    // Se está contestando, usa mode contest
    if (isContesting) {
      fetchAIResponse(newHistory, "contest");
      return;
    }

    fetchAIResponse(newHistory, "discuss");
  }

  // Pede para IA dar a nota
  function handleRequestScore() {
    const history = answer.chatHistory || [];

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: "Por favor, dê sua nota agora com base em tudo que discutimos.",
      timestamp: new Date(),
    };

    const newHistory = [...history, userMsg];
    updateAnswer({ chatHistory: newHistory });
    fetchAIResponse(newHistory, "score");
  }

  // Inicia contestação
  function handleStartContest() {
    setIsContesting(true);
    setChatInput("");
  }

  // Aceita a nota da IA
  function handleAcceptScore() {
    updateAnswer({ aiValidated: true });
  }

  function handleNavigate(direction: "prev" | "next") {
    const targetIdx = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    setCurrentIndex(targetIdx);
    setIsContesting(false);
  }

  async function handleFinalize() {
    if (!evaluation) return;
    const allScored = evaluation.answers.every((a) => a.score !== null && a.aiValidated);
    if (!allScored) {
      const pending = evaluation.answers
        .map((a, i) => (!a.score || !a.aiValidated ? questions[i] : null))
        .filter(Boolean);
      const names = pending.map((q) => `• ${q!.title}`).join("\n");
      alert(
        `As seguintes perguntas ainda não receberam nota da IA:\n\n${names}\n\nDiscuta com a IA e peça a nota para cada uma.`
      );
      return;
    }
    const updated = { ...evaluation, status: "concluida" as const };
    await upsertEvaluation(updated);
    router.push("/historico");
  }

  const progress =
    evaluation.answers.filter((a) => a.score !== null && a.aiValidated).length /
    questions.length;

  // Estado do chat
  const chatState = (() => {
    if (!hasJustification && !hasChat) return "waiting_answer";
    if (hasJustification && !hasChat) return "ready_to_send";
    if (hasChat && !hasScore) return "discussing";
    if (hasScore && isContesting) return "contesting";
    if (hasScore) return "scored";
    return "discussing";
  })();

  // Mínimo de trocas antes de poder pedir nota
  const userMsgCount = (answer.chatHistory || []).filter((m) => m.role === "user").length;
  const aiMsgCount = (answer.chatHistory || []).filter((m) => m.role === "assistant").length;
  const canRequestScore = userMsgCount >= 2 && aiMsgCount >= 1 && !hasScore;

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
          {employee?.photoUrl ? (
            <img src={employee.photoUrl} alt={employee.name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
              {employee?.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                {employee?.name}
              </h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${evaluationTypeColors[evaluationType]}`}>
                {evaluationTypeLabels[evaluationType]}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {employee?.cargo} · {employee?.sector}
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

      {/* Value navigation — grouped by valor */}
      <div className="space-y-2 mb-6">
        {Object.entries(valueGroups).map(([category, indices]) => (
          <div key={category} className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 w-36 truncate">
              {category}
            </span>
            <div className="flex gap-1.5">
              {indices.map((i) => {
                const a = evaluation.answers[i];
                const isActive = i === currentIndex;
                const scored = a?.score !== null && a?.aiValidated;
                return (
                  <button
                    key={i}
                    onClick={() => { setCurrentIndex(i); setIsContesting(false); }}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                      isActive
                        ? "bg-primary text-white"
                        : scored
                        ? "bg-accent/10 text-accent border border-accent/20"
                        : a?.chatHistory?.length > 0
                        ? "bg-secondary/10 text-secondary border border-secondary/20"
                        : "bg-gray-100 text-gray-400"
                    }`}
                    title={questions[i]?.title}
                  >
                    {scored ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      `P${(indices.indexOf(i) + 1)}`
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Question & Answer */}
        <div className="space-y-6">
          {/* Question card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <span className="text-xs font-medium px-2.5 py-1 bg-primary/10 text-primary rounded-full">
              {question.category}
            </span>
            <h2 className="text-lg font-semibold text-gray-900 mt-3">
              {question.title}
            </h2>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              {question.description}
            </p>
          </div>

          {/* Answer textarea */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Sua resposta
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              {evaluationType === "auto"
                ? "Descreva com exemplos concretos como você se comportou nos últimos 6 meses."
                : evaluationType === "par"
                ? "Descreva com exemplos como esse colega colabora e contribui no dia a dia."
                : evaluationType === "liderado"
                ? "Descreva com exemplos como seu gestor lidera, apoia e direciona a equipe."
                : "Descreva com exemplos concretos e recentes. A IA vai discutir com você e depois dar a nota."}
            </p>
            <textarea
              value={answer.justification}
              onChange={(e) => updateAnswer({ justification: e.target.value })}
              rows={4}
              disabled={hasChat}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50 disabled:text-gray-500"
              placeholder={
                evaluationType === "auto"
                  ? "Ex: Quando enfrentei o desafio X, eu tomei a iniciativa de..."
                  : evaluationType === "par"
                  ? "Ex: No projeto compartilhado X, esse colega contribuiu com..."
                  : evaluationType === "liderado"
                  ? "Ex: Quando tive dificuldade com X, meu gestor me ajudou..."
                  : "Ex: No projeto X, quando tivemos o problema Y, o colaborador fez Z..."
              }
            />
            {hasJustification && !hasChat && (
              <button
                onClick={handleSubmitAnswer}
                disabled={isAiTyping}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm font-medium disabled:opacity-30"
              >
                <Bot className="w-4 h-4" />
                Iniciar discussão com IA
              </button>
            )}
          </div>

          {/* Score display (when AI has scored) */}
          {hasScore && (
            <div className={`bg-white rounded-xl p-6 shadow-sm border-2 ${
              isComplete ? "border-accent/30" : "border-secondary/30"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Star className="w-4 h-4 text-secondary" />
                  Nota da IA
                </h3>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold score-${answer.score}`}>
                  {answer.score}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {question.scale.find((s) => s.score === answer.score)?.label} — {question.scale.find((s) => s.score === answer.score)?.description}
              </p>

              {!isContesting && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleAcceptScore}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition text-sm font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Aceitar nota
                  </button>
                  <button
                    onClick={handleStartContest}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-secondary/30 text-secondary rounded-lg hover:bg-secondary/5 transition text-sm font-medium"
                  >
                    <MessageSquareWarning className="w-4 h-4" />
                    Contestar
                  </button>
                </div>
              )}

              {isContesting && (
                <p className="text-xs text-secondary mt-3 flex items-center gap-1.5">
                  <Scale className="w-3 h-3" />
                  Traga fatos e dados no chat para contestar a nota
                </p>
              )}

              {isComplete && !isContesting && (
                <p className="mt-3 text-xs text-accent flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" />
                  Nota aceita — pode avançar
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
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-30"
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
                  Avaliador IA
                </h3>
                <p className="text-xs text-gray-400">
                  Discute, avalia e dá a nota com base nos valores Seazone
                </p>
              </div>
            </div>
          </div>

          {chatState === "waiting_answer" && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">
                  Responda a pergunta ao lado para iniciar
                </p>
              </div>
            </div>
          )}

          {chatState === "ready_to_send" && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <Bot className="w-12 h-12 text-primary/20 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">
                  Resposta preenchida
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Clique em &quot;Iniciar discussão com IA&quot;
                </p>
              </div>
            </div>
          )}

          {(chatState === "discussing" || chatState === "scored" || chatState === "contesting") && (
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

                {isComplete && !isContesting && (
                  <div className="flex justify-center">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-accent bg-accent/10">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Nota aceita — pode avançar
                    </span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-gray-100 space-y-2">
                {/* Botão para pedir nota */}
                {canRequestScore && (
                  <button
                    onClick={handleRequestScore}
                    disabled={isAiTyping}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-white rounded-xl hover:bg-secondary/90 transition text-sm font-medium disabled:opacity-30"
                  >
                    <Star className="w-4 h-4" />
                    Receber nota da IA
                  </button>
                )}

                {/* Input de chat (discussão ou contestação) */}
                {(!hasScore || isContesting) && (
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
                      placeholder={
                        isContesting
                          ? "Traga fatos e dados para contestar..."
                          : "Responda à IA..."
                      }
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
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </AppShell>
  );
}
