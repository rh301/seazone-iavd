"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getQuestions } from "@/lib/store";
import { fetchDirectorInsights, upsertDirectorInsight } from "@/lib/db";
import { Question, DirectorInsight } from "@/lib/types";
import AppShell from "@/components/app-shell";
import {
  Brain,
  Save,
  CheckCircle2,
  ShieldAlert,
  MessageSquare,
} from "lucide-react";

export default function InterpretacoesPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [insights, setInsights] = useState<Record<string, string>>({});
  const [savedQuestions, setSavedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const qs = getQuestions();
    setQuestions(qs);

    if (user) {
      async function loadInsights() {
        const existing = await fetchDirectorInsights();
        const mapped: Record<string, string> = {};
        for (const insight of existing) {
          if (insight.userId === user!.id) {
            mapped[insight.questionId] = insight.interpretation;
          }
        }
        setInsights(mapped);
      }
      loadInsights();
    }
  }, [user]);

  if (!user) return null;

  if (!["c_level", "rh", "diretor"].includes(user.role)) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <ShieldAlert className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900">
            Sem permissão
          </h2>
          <p className="text-gray-500 mt-1">
            Apenas C-Level, RH e Diretores podem configurar interpretações.
          </p>
        </div>
      </AppShell>
    );
  }

  async function handleSave(questionId: string) {
    if (!user) return;
    const text = insights[questionId]?.trim();
    if (!text) return;

    await upsertDirectorInsight({
      questionId,
      userId: user.id,
      interpretation: text,
      updatedAt: new Date().toISOString(),
    });

    setSavedQuestions((prev) => new Set([...prev, questionId]));
    setTimeout(() => {
      setSavedQuestions((prev) => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    }, 2000);
  }

  async function handleSaveAll() {
    if (!user) return;
    for (const q of questions) {
      const text = insights[q.id]?.trim();
      if (text) {
        await upsertDirectorInsight({
          questionId: q.id,
          userId: user.id,
          interpretation: text,
          updatedAt: new Date().toISOString(),
        });
      }
    }
    setSavedQuestions(new Set(questions.map((q) => q.id)));
    setTimeout(() => setSavedQuestions(new Set()), 2000);
  }

  return (
    <AppShell>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Brain className="w-7 h-7 text-primary" />
              Interpretações da Diretoria
            </h1>
            <p className="text-gray-500 mt-1">
              Descreva o que você, como liderança, entende por cada critério de
              avaliação. A IA usará suas interpretações para orientar os gestores
              durante as avaliações.
            </p>
          </div>
          <button
            onClick={handleSaveAll}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            Salvar tudo
          </button>
        </div>

        <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-secondary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-800">
                Como funciona?
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Quando um gestor atribuir nota 1, 2, 4 ou 5 a um colaborador, a
                IA vai questionar a justificativa baseando-se na escala padrão{" "}
                <strong>e</strong> nas suas interpretações personalizadas. Assim,
                as avaliações ficam alinhadas com a visão estratégica da
                liderança.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q) => {
            const isSaved = savedQuestions.has(q.id);
            return (
              <div
                key={q.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2.5 py-0.5 bg-primary/10 text-primary rounded-full">
                        {q.category}
                      </span>
                      {isSaved && (
                        <span className="flex items-center gap-1 text-xs text-accent">
                          <CheckCircle2 className="w-3 h-3" />
                          Salvo
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {q.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {q.description}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-2">
                    Escala atual (referência):
                  </p>
                  <div className="flex gap-2">
                    {q.scale.map((s) => (
                      <div
                        key={s.score}
                        className="flex-1 text-center"
                      >
                        <span
                          className={`inline-block w-7 h-7 rounded-full text-xs font-bold leading-7 score-${s.score}`}
                        >
                          {s.score}
                        </span>
                        <p className="text-[10px] text-gray-500 mt-1">
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <textarea
                  value={insights[q.id] || ""}
                  onChange={(e) =>
                    setInsights((prev) => ({
                      ...prev,
                      [q.id]: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder={`O que você entende por "${q.title}"? O que diferencia um colaborador nota 2 de um nota 4 neste critério? Exemplos do dia a dia...`}
                />

                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => handleSave(q.id)}
                    disabled={!insights[q.id]?.trim()}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-dark transition disabled:opacity-30"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Salvar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
