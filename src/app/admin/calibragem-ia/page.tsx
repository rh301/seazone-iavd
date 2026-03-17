"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { canManageQuestions } from "@/lib/permissions";
import { getQuestions } from "@/lib/store";
import {
  fetchDirectorChat,
  upsertDirectorChat,
  fetchInsightsForQuestion,
  upsertDirectorInsight,
} from "@/lib/db";
import { Question, ChatMessage, DirectorInsight } from "@/lib/types";
import { formatChatContent } from "@/lib/format-chat";
import AppShell from "@/components/app-shell";
import {
  Bot,
  User,
  Send,
  ShieldAlert,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  FileText,
  Trash2,
  RefreshCw,
} from "lucide-react";

export default function CalibracgemIAPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [chatStatuses, setChatStatuses] = useState<Record<string, "none" | "started" | "done">>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuestions(getQuestions());
  }, []);

  // Load chat when question changes
  useEffect(() => {
    if (!user || questions.length === 0) return;
    async function loadChat() {
      const q = questions[selectedIdx];
      const saved = await fetchDirectorChat(q.id, user!.id);
      setChatHistory(saved);

      // Load statuses for all questions
      const statuses: Record<string, "none" | "started" | "done"> = {};
      for (const question of questions) {
        const msgs = await fetchDirectorChat(question.id, user!.id);
        const insights = await fetchInsightsForQuestion(question.id);
        const hasInsight = insights.some((i) => i.userId === user!.id && i.interpretation.length > 50);
        if (hasInsight) statuses[question.id] = "done";
        else if (msgs.length > 0) statuses[question.id] = "started";
        else statuses[question.id] = "none";
      }
      setChatStatuses(statuses);
    }
    loadChat();
  }, [user, questions, selectedIdx]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  if (!user) return null;

  if (!canManageQuestions(user)) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <ShieldAlert className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900">Sem permissão</h2>
          <p className="text-gray-500 mt-1">Apenas diretoria e RH podem acessar.</p>
        </div>
      </AppShell>
    );
  }

  const question = questions[selectedIdx];
  if (!question) return null;

  async function fetchAI(history: ChatMessage[], mode: "explore" | "summarize") {
    setIsAiTyping(true);
    try {
      const insightsForQ = await fetchInsightsForQuestion(question.id);
      const existingInsights = insightsForQ
        .filter((i) => i.userId === user!.id)
        .map((i) => i.interpretation)
        .join("\n");

      const res = await fetch("/api/chat-diretoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          chatHistory: history,
          mode,
          existingInsights: existingInsights || undefined,
        }),
      });
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      };

      const newHistory = [...history, aiMsg];
      setChatHistory(newHistory);
      await upsertDirectorChat(question.id, user!.id, newHistory);

      // If summarize mode, also save as DirectorInsight
      if (mode === "summarize") {
        const insight: DirectorInsight = {
          questionId: question.id,
          userId: user!.id,
          interpretation: data.content,
          updatedAt: new Date().toISOString(),
        };
        await upsertDirectorInsight(insight);
        setChatStatuses((prev) => ({ ...prev, [question.id]: "done" }));
      } else {
        setChatStatuses((prev) => ({
          ...prev,
          [question.id]: prev[question.id] === "done" ? "done" : "started",
        }));
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: "Erro ao processar. Tente novamente.",
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiTyping(false);
    }
  }

  function handleStartChat() {
    fetchAI([], "explore");
  }

  async function handleSendMessage() {
    if (!chatInput.trim() || isAiTyping) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    await upsertDirectorChat(question.id, user!.id, newHistory);
    setChatInput("");
    fetchAI(newHistory, "explore");
  }

  function handleGenerateSummary() {
    fetchAI(chatHistory, "summarize");
  }

  async function handleClearChat() {
    if (!confirm("Limpar toda a conversa sobre esse valor?")) return;
    setChatHistory([]);
    await upsertDirectorChat(question.id, user!.id, []);
    setChatStatuses((prev) => ({ ...prev, [question.id]: "none" }));
  }

  async function handleRestart() {
    if (!confirm("Recomeçar a conversa do zero? A conversa atual será apagada.")) return;
    setChatHistory([]);
    await upsertDirectorChat(question.id, user!.id, []);
    setChatStatuses((prev) => ({ ...prev, [question.id]: "none" }));
    // Inicia nova conversa automaticamente
    setTimeout(() => fetchAI([], "explore"), 100);
  }

  // Group questions by category
  const categories = questions.reduce<Record<string, { q: Question; idx: number }[]>>(
    (acc, q, i) => {
      (acc[q.category] = acc[q.category] || []).push({ q, idx: i });
      return acc;
    },
    {}
  );

  return (
    <AppShell>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-primary" />
            Calibragem com IA
          </h1>
          <p className="text-gray-500 mt-1">
            Converse com a IA para definir os critérios de cada valor
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Question list */}
          <div className="space-y-4">
            {Object.entries(categories).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  {category}
                </h3>
                <div className="space-y-1.5">
                  {items.map(({ q, idx }) => {
                    const status = chatStatuses[q.id] || "none";
                    const isActive = idx === selectedIdx;

                    return (
                      <button
                        key={q.id}
                        onClick={() => setSelectedIdx(idx)}
                        className={`w-full text-left p-3 rounded-lg transition text-sm flex items-center gap-2 ${
                          isActive
                            ? "bg-primary text-white"
                            : "bg-white border border-gray-100 hover:border-primary/20 text-gray-700"
                        }`}
                      >
                        {status === "done" ? (
                          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-accent"}`} />
                        ) : status === "started" ? (
                          <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-secondary"}`} />
                        ) : (
                          <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${isActive ? "border-white" : "border-gray-300"}`} />
                        )}
                        <span className="truncate">{q.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Chat */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-220px)]">
            {/* Chat header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {question.title}
                  </h3>
                  <p className="text-xs text-gray-400">{question.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {chatHistory.length > 2 && (
                  <button
                    onClick={handleGenerateSummary}
                    disabled={isAiTyping}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent/90 transition disabled:opacity-30"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Gerar resumo
                  </button>
                )}
                {chatHistory.length > 0 && (
                  <button
                    onClick={handleRestart}
                    disabled={isAiTyping}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-secondary/30 text-secondary rounded-lg text-xs font-medium hover:bg-secondary/5 transition disabled:opacity-30"
                    title="Recomeçar conversa"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Recomeçar
                  </button>
                )}
                {chatHistory.length > 0 && (
                  <button
                    onClick={handleClearChat}
                    className="p-1.5 text-gray-400 hover:text-danger transition"
                    title="Limpar conversa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Chat body */}
            {chatHistory.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-sm">
                  <Sparkles className="w-12 h-12 text-primary/20 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Calibrar &quot;{question.title}&quot;
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    A IA vai te fazer perguntas sobre o que cada nota significa
                    nesse valor. Responda com exemplos reais.
                  </p>
                  <button
                    onClick={handleStartChat}
                    disabled={isAiTyping}
                    className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-30"
                  >
                    Iniciar conversa
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatHistory.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          msg.role === "assistant" ? "bg-primary/10" : "bg-gray-100"
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

                {/* Input */}
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
                      placeholder="Descreva seus critérios, dê exemplos..."
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
