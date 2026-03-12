"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { Question, Evaluation, ChatMessage, Answer } from "@/lib/types";
import { getQuestions, getEvaluation, saveEvaluation } from "@/lib/store";
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
  MessageSquare,
  Save,
} from "lucide-react";

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
  const [showChat, setShowChat] = useState(false);
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

  function updateAnswer(updates: Partial<Answer>) {
    if (!evaluation) return;
    const newAnswers = [...evaluation.answers];
    newAnswers[currentIndex] = { ...newAnswers[currentIndex], ...updates };
    const updated = { ...evaluation, answers: newAnswers };
    setEvaluation(updated);
    saveEvaluation(updated);
  }

  async function fetchAIResponse(history: ChatMessage[], score: number) {
    setIsAiTyping(true);
    const scaleLevel = question.scale.find((s) => s.score === score);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          score,
          scaleLevel,
          employeeName: employee?.name || "",
          justification: answer.justification,
          chatHistory: history,
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

  function handleScoreSelect(score: number) {
    updateAnswer({ score });
    setShowChat(true);

    const initialUserMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: `Estou avaliando ${employee?.name} no critério "${question.title}" e atribuí nota ${score}.`,
      timestamp: new Date(),
    };

    const history = [initialUserMsg];
    updateAnswer({ chatHistory: history });
    fetchAIResponse(history, score);
  }

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
    fetchAIResponse(newHistory, answer.score!);
  }

  function handleFinalize() {
    if (!evaluation) return;
    const allAnswered = evaluation.answers.every((a) => a.score !== null);
    if (!allAnswered) {
      alert("Responda todas as perguntas antes de finalizar.");
      return;
    }
    const updated = { ...evaluation, status: "concluida" as const };
    saveEvaluation(updated);
    router.push("/historico");
  }

  const progress =
    evaluation.answers.filter((a) => a.score !== null).length / questions.length;

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
          return (
            <button
              key={q.id}
              onClick={() => {
                setCurrentIndex(i);
                setShowChat(!!a?.chatHistory?.length);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                isActive
                  ? "bg-primary text-white"
                  : isAnswered
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {i + 1}. {q.title.length > 20 ? q.title.slice(0, 20) + "…" : q.title}
              {isAnswered && !isActive && (
                <CheckCircle2 className="w-3 h-3 inline ml-1" />
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Question & Score */}
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
              Selecione a nota
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
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Justificativa
            </h3>
            <textarea
              value={answer.justification}
              onChange={(e) => updateAnswer({ justification: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Descreva exemplos concretos que justificam essa nota..."
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => {
                if (currentIndex > 0) {
                  setCurrentIndex(currentIndex - 1);
                  const prevAnswer = evaluation.answers[currentIndex - 1];
                  setShowChat(!!prevAnswer?.chatHistory?.length);
                }
              }}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
            <button
              onClick={() => {
                if (currentIndex < questions.length - 1) {
                  setCurrentIndex(currentIndex + 1);
                  const nextAnswer = evaluation.answers[currentIndex + 1];
                  setShowChat(!!nextAnswer?.chatHistory?.length);
                }
              }}
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
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
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
            {!showChat && answer.score !== null && (
              <button
                onClick={() => setShowChat(true)}
                className="flex items-center gap-1.5 text-xs text-primary font-medium"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Ver conversa
              </button>
            )}
          </div>

          {!answer.score ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">
                  Selecione uma nota para iniciar a conversa com a IA
                </p>
              </div>
            </div>
          ) : (
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
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-gray-100">
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
                    placeholder="Responda à IA ou adicione contexto..."
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
