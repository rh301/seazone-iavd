"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Evaluation, Question } from "@/lib/types";
import { getQuestions } from "@/lib/store";
import { fetchEvaluation } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { canViewEvaluation } from "@/lib/permissions";
import { findUser } from "@/lib/org-tree";
import { roleLabels } from "@/lib/auth-types";
import AppShell from "@/components/app-shell";
import { formatChatContent } from "@/lib/format-chat";
import {
  ChevronLeft,
  Bot,
  User,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";

export default function DetalhesAvaliacao({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const eval_ = await fetchEvaluation(id);
      if (!eval_) {
        router.push("/historico");
        return;
      }
      if (currentUser && !canViewEvaluation(currentUser, eval_.employeeId, eval_.evaluatorId)) {
        router.push("/");
        return;
      }
      // Histórico só mostra avaliações do gestor
      if (eval_.evaluationType !== "gestor") {
        router.push("/historico");
        return;
      }
      setEvaluation(eval_);
      setQuestions(getQuestions());
    }
    load();
  }, [id, router, currentUser]);

  if (!evaluation || !currentUser) return null;

  const employee = findUser(evaluation.employeeId);
  const evaluator = findUser(evaluation.evaluatorId);

  const scores = evaluation.answers
    .map((a) => a.score)
    .filter((s): s is number => s !== null);
  const avgScore = scores.length > 0
    ? (scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  const statusLabels: Record<string, string> = {
    em_andamento: "Em andamento",
    concluida: "Concluída",
  };

  const statusColors: Record<string, string> = {
    em_andamento: "text-secondary bg-secondary/10",
    concluida: "text-accent bg-accent/10",
  };

  return (
    <AppShell>
      <div>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push("/historico")}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              Avaliação — {employee?.name}
            </h1>
            <p className="text-sm text-gray-500">
              {employee ? roleLabels[employee.role] : ""} · {employee?.department}
              {evaluator && evaluator.id !== currentUser.id && (
                <span> · Avaliado por {evaluator.name}</span>
              )}
            </p>
          </div>
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${statusColors[evaluation.status]}`}
          >
            {statusLabels[evaluation.status]}
          </span>
        </div>

        {/* Summary card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
            <p className="text-3xl font-bold text-primary">
              {avgScore > 0 ? avgScore.toFixed(1) : "—"}
            </p>
            <p className="text-sm text-gray-500 mt-1">Nota média</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
            <p className="text-3xl font-bold text-gray-900">
              {scores.length}/{questions.length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Critérios avaliados</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
            <p className="text-3xl font-bold text-gray-900">
              {new Date(evaluation.date).toLocaleDateString("pt-BR")}
            </p>
            <p className="text-sm text-gray-500 mt-1">Data da avaliação</p>
          </div>
        </div>

        {/* Score distribution bar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Distribuição das notas
          </h2>
          <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
            {[1, 2, 3, 4, 5].map((s) => {
              const count = scores.filter((sc) => sc === s).length;
              const pct = scores.length > 0 ? (count / scores.length) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={s}
                  className={`score-${s} flex items-center justify-center text-xs font-bold transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`Nota ${s}: ${count} critério(s)`}
                >
                  {count > 0 && s}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            {[1, 2, 3, 4, 5].map((s) => {
              const count = scores.filter((sc) => sc === s).length;
              return (
                <div key={s} className="text-center flex-1">
                  <span className="text-xs text-gray-400">
                    Nota {s}: {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Questions detail */}
        <div className="space-y-4">
          {questions.map((q, i) => {
            const answer = evaluation.answers[i];
            if (!answer) return null;
            const isExpanded = expandedQuestion === q.id;
            const scaleLevel = q.scale.find((s) => s.score === answer.score);
            const hasChat = answer.chatHistory && answer.chatHistory.length > 0;

            return (
              <div
                key={q.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100"
              >
                <button
                  onClick={() =>
                    setExpandedQuestion(isExpanded ? null : q.id)
                  }
                  className="w-full p-5 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        answer.score ? `score-${answer.score}` : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {answer.score ?? "—"}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {q.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          {q.category}
                        </span>
                        {scaleLevel && (
                          <span className="text-xs text-gray-500">
                            {scaleLevel.label}
                          </span>
                        )}
                        {hasChat && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MessageSquare className="w-3 h-3" />
                            {answer.chatHistory.length} msg
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4">
                    {/* Scale description */}
                    {scaleLevel && (
                      <div className={`p-4 rounded-lg border-l-4 score-${answer.score}-light`}>
                        <p className="text-sm text-gray-700">
                          <strong>Interpretação da diretoria:</strong>{" "}
                          {scaleLevel.description}
                        </p>
                      </div>
                    )}

                    {/* Justification */}
                    {answer.justification && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Justificativa do gestor
                        </h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          {answer.justification}
                        </p>
                      </div>
                    )}

                    {/* Chat history */}
                    {hasChat && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Bot className="w-4 h-4 text-primary" />
                          Conversa com a IA
                        </h4>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {answer.chatHistory.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex gap-3 ${
                                msg.role === "user" ? "flex-row-reverse" : ""
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                  msg.role === "assistant"
                                    ? "bg-primary/10"
                                    : "bg-gray-100"
                                }`}
                              >
                                {msg.role === "assistant" ? (
                                  <Bot className="w-3 h-3 text-primary" />
                                ) : (
                                  <User className="w-3 h-3 text-gray-500" />
                                )}
                              </div>
                              <div
                                className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-line ${
                                  msg.role === "assistant"
                                    ? "bg-gray-50 text-gray-700"
                                    : "bg-primary/10 text-gray-800"
                                }`}
                                dangerouslySetInnerHTML={{
                                  __html: formatChatContent(msg.content),
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
