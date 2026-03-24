"use client";

import { useEffect, useState, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Question, Evaluation, Answer, EvaluationType, evaluationTypeLabels, evaluationTypeColors } from "@/lib/types";
import { getQuestions } from "@/lib/store";
import { fetchEvaluation, upsertEvaluation } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { findUser } from "@/lib/org-tree";
import AppShell from "@/components/app-shell";
import {
  ChevronLeft,
  CheckCircle2,
  Bot,
  Loader2,
  Send,
  RefreshCw,
} from "lucide-react";

// Mapeamento: nota interna 1-5 ↔ conceito A-E (A=melhor, E=pior)
const scoreToGrade: Record<number, string> = { 5: "A", 4: "B", 3: "C", 2: "D", 1: "E" };
const gradeToScore: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };
const grades = ["A", "B", "C", "D", "E"] as const;

const gradeLabels: Record<string, string> = {
  A: "Excepcional",
  B: "Acima do esperado",
  C: "Dentro do esperado",
  D: "Abaixo do esperado",
  E: "Insuficiente",
};

const gradeColors: Record<string, string> = {
  A: "bg-primary text-white",
  B: "bg-green-500 text-white",
  C: "bg-yellow-500 text-white",
  D: "bg-orange-500 text-white",
  E: "bg-red-500 text-white",
};

const gradeColorsOutline: Record<string, string> = {
  A: "border-primary/30 text-primary hover:bg-primary/5",
  B: "border-green-300 text-green-600 hover:bg-green-50",
  C: "border-yellow-300 text-yellow-600 hover:bg-yellow-50",
  D: "border-orange-300 text-orange-600 hover:bg-orange-50",
  E: "border-red-300 text-red-600 hover:bg-red-50",
};

interface AIFeedbackItem {
  questionId: string;
  currentGrade: string;
  suggestedGrade: string;
  reasoning: string;
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
  const [aiFeedback, setAiFeedback] = useState<Record<string, AIFeedbackItem>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Debounced auto-save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const evaluationRef = useRef<Evaluation | null>(null);

  useEffect(() => {
    evaluationRef.current = evaluation;
  }, [evaluation]);

  const debouncedSave = useCallback((updated: Evaluation) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      upsertEvaluation(updated);
    }, 2500);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      // Final save on unmount
      if (evaluationRef.current) {
        upsertEvaluation(evaluationRef.current);
      }
    };
  }, []);

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

  if (!evaluation || !currentUser) return null;

  const employee = findUser(evaluation.employeeId);
  const evaluationType: EvaluationType = evaluation.evaluationType || "gestor";

  // Group questions by category
  const questionsByCategory = questions.reduce<Record<string, { question: Question; index: number }[]>>((acc, q, i) => {
    if (!acc[q.category]) acc[q.category] = [];
    acc[q.category].push({ question: q, index: i });
    return acc;
  }, {});

  // Count filled answers
  const filledCount = evaluation.answers.filter((a) => a.score !== null).length;

  // Check if form is ready for AI analysis
  const allAnswersReady = evaluation.answers.every((a, i) => {
    if (a.score === null) return false;
    if (a.score !== 3 && a.justification.trim().length < 100) return false;
    return true;
  });

  function updateAnswerAtIndex(index: number, updates: Partial<Answer>) {
    setEvaluation((prev) => {
      if (!prev) return prev;
      const newAnswers = [...prev.answers];
      newAnswers[index] = { ...newAnswers[index], ...updates };
      const updated = { ...prev, answers: newAnswers };
      debouncedSave(updated);
      return updated;
    });
  }

  function handleSelectGrade(index: number, grade: string) {
    if (evaluation!.status === "concluida") return;
    const score = gradeToScore[grade];
    const currentAnswer = evaluation!.answers[index];
    // If changing to C, clear justification; otherwise preserve existing
    if (grade === "C") {
      updateAnswerAtIndex(index, {
        score,
        justification: "",
        aiValidated: false,
      });
    } else {
      updateAnswerAtIndex(index, {
        score,
        aiValidated: false,
        // Keep existing justification if switching between non-C grades
        justification: currentAnswer.score === 3 ? "" : currentAnswer.justification,
      });
    }
    // Clear AI feedback for this question if grade changes after analysis
    if (hasAnalyzed) {
      const qId = questions[index]?.id;
      if (qId && aiFeedback[qId]) {
        setAiFeedback((prev) => {
          const next = { ...prev };
          delete next[qId];
          return next;
        });
      }
    }
  }

  function handleJustificationChange(index: number, value: string) {
    if (evaluation!.status === "concluida") return;
    updateAnswerAtIndex(index, { justification: value });
  }

  async function handleAnalyze() {
    if (!allAnswersReady || isAnalyzing) return;
    setIsAnalyzing(true);

    const allAnswers = evaluation!.answers.map((a, i) => ({
      questionId: questions[i]?.id || "",
      questionTitle: questions[i]?.title || "",
      category: questions[i]?.category || "",
      score: a.score!,
      justification: a.justification,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: { title: "", description: "", category: "", scale: [] },
          employeeName: employee?.name || "",
          justification: "",
          chatHistory: [],
          mode: "holistic",
          allAnswers,
          evaluationType,
          evaluatorSector: currentUser?.sector || "",
          evaluateeSector: employee?.sector || "",
          evaluateeCargo: employee?.cargo || "",
        }),
      });

      // Handle both streaming (SSE) and non-streaming (JSON) responses
      let fullContent = "";
      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream")) {
        // Read SSE stream and collect full content
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6));
                if (event.done && event.content) {
                  fullContent = event.content;
                } else if (event.delta) {
                  fullContent += event.delta;
                } else if (event.error && event.content) {
                  fullContent = event.content;
                }
              } catch { /* skip unparseable */ }
            }
          }
        }
      } else {
        // Non-streaming JSON response (fallback or cached)
        const data = await res.json();
        fullContent = data.content;
      }

      // Handle rate limiting
      if (res.status === 429) {
        alert("O sistema está com muitos acessos. Aguarde alguns segundos e tente novamente.");
        return;
      }

      // Parse response — expect JSON with feedback array
      let feedbackItems: AIFeedbackItem[] = [];
      try {
        let content = fullContent;
        // Strip markdown code fences if present
        if (typeof content === "string") {
          content = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        }
        const parsed = typeof content === "string" ? JSON.parse(content) : content;
        feedbackItems = parsed.feedback || [];
      } catch {
        console.error("Failed to parse AI feedback as JSON:", fullContent);
        // Try regex extraction as last resort
        try {
          const jsonMatch = fullContent.match(/\{[\s\S]*"feedback"[\s\S]*\}/);
          if (jsonMatch) {
            feedbackItems = JSON.parse(jsonMatch[0]).feedback || [];
          }
        } catch { /* give up */ }
      }

      const feedbackMap: Record<string, AIFeedbackItem> = {};
      for (const item of feedbackItems) {
        if (item.questionId && item.reasoning) {
          feedbackMap[item.questionId] = item;
        }
      }
      setAiFeedback(feedbackMap);
      setHasAnalyzed(true);
    } catch (err) {
      console.error("AI analysis error:", err);
      alert("Erro ao analisar com a IA. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleFinalize() {
    if (!evaluation) return;

    // Validate all answers
    const allValid = evaluation.answers.every((a, i) => {
      if (a.score === null) return false;
      if (a.score !== 3 && a.justification.trim().length < 100) return false;
      return true;
    });

    if (!allValid) {
      alert("Todas as perguntas precisam ter conceito. Conceitos diferentes de C precisam de justificativa (mínimo 100 caracteres).");
      return;
    }

    // Set all answers as validated and evaluation as complete
    const finalAnswers = evaluation.answers.map((a) => ({
      ...a,
      aiValidated: true,
    }));

    const updated: Evaluation = {
      ...evaluation,
      answers: finalAnswers,
      status: "concluida" as const,
    };

    await upsertEvaluation(updated);
    router.push("/avaliacao");
  }

  const isConcluida = evaluation.status === "concluida";

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
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
              <img src={employee.photoUrl} alt={employee.name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
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
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              {filledCount} de {questions.length} preenchidas
            </span>
            {isConcluida && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-accent">
                <CheckCircle2 className="w-4 h-4" />
                Avaliação concluída
              </span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(filledCount / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* All questions grouped by category */}
        <div className="space-y-8">
          {Object.entries(questionsByCategory).map(([category, items]) => (
            <div key={category}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-semibold px-3 py-1.5 bg-primary/10 text-primary rounded-full">
                  {category}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="space-y-6">
                {items.map(({ question, index }) => {
                  const answer = evaluation.answers[index];
                  if (!answer) return null;
                  const currentGrade = answer.score !== null ? scoreToGrade[answer.score] : null;
                  const isScoreC = answer.score === 3;
                  const needsJustification = answer.score !== null && !isScoreC;
                  const feedback = aiFeedback[question.id];

                  return (
                    <div
                      key={question.id}
                      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                    >
                      {/* Question title and description */}
                      <div className="mb-4">
                        <h3 className="text-base font-semibold text-gray-900">
                          {question.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                          {question.description}
                        </p>
                      </div>

                      {/* Grade selector */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-400 mb-2">
                          C é o esperado para a maioria. Conceitos diferentes precisam de justificativa.
                        </p>
                        <div className="flex gap-2">
                          {grades.map((grade) => {
                            const score = gradeToScore[grade];
                            const isSelected = currentGrade === grade;
                            const scaleLevel = question.scale.find((s) => s.score === score);
                            return (
                              <button
                                key={grade}
                                onClick={() => handleSelectGrade(index, grade)}
                                disabled={isConcluida}
                                className={`flex-1 py-2.5 rounded-xl text-center transition border-2 ${
                                  isSelected
                                    ? gradeColors[grade] + " border-transparent shadow-md scale-105"
                                    : gradeColorsOutline[grade] + " bg-white"
                                } disabled:opacity-60 disabled:cursor-not-allowed`}
                                title={scaleLevel?.description}
                              >
                                <span className="text-xl font-bold block">{grade}</span>
                                <span className="text-[10px] block mt-0.5 opacity-80">
                                  {gradeLabels[grade]}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Scale description for selected grade */}
                      {currentGrade && (
                        <div className="mb-3 p-2.5 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">
                            <span className="font-semibold">Conceito {currentGrade} — {question.scale.find((s) => s.score === answer.score)?.label}:</span>{" "}
                            {question.scale.find((s) => s.score === answer.score)?.description}
                          </p>
                        </div>
                      )}

                      {/* Justification textarea (for grades != C) */}
                      {needsJustification && (
                        <div className="mt-3">
                          <label className="text-sm font-medium text-gray-700 block mb-1.5">
                            Justifique o conceito {currentGrade}
                          </label>
                          <p className="text-xs text-gray-400 mb-2">
                            {(answer.score ?? 0) > 3
                              ? "Conceitos acima de C exigem exemplos concretos que demonstrem desempenho acima do esperado."
                              : "Conceitos abaixo de C exigem exemplos concretos do comportamento observado."}
                          </p>
                          <textarea
                            value={answer.justification}
                            onChange={(e) => handleJustificationChange(index, e.target.value)}
                            rows={3}
                            disabled={isConcluida}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50 disabled:text-gray-500 resize-none"
                            placeholder="Descreva situações concretas e recentes (últimos 6 meses)..."
                          />
                          {answer.justification.trim().length > 0 && answer.justification.trim().length < 100 && (
                            <p className="text-xs text-red-500 mt-1">
                              Justificativa deve ter pelo menos 100 caracteres.
                            </p>
                          )}
                        </div>
                      )}

                      {/* AI feedback inline */}
                      {feedback && (() => {
                        const agrees = feedback.suggestedGrade === feedback.currentGrade;
                        return (
                          <div className={`mt-4 p-4 rounded-lg border ${
                            agrees
                              ? "bg-emerald-50 border-emerald-200"
                              : "bg-amber-50 border-amber-200"
                          }`}>
                            <div className="flex items-start gap-2">
                              <Bot className={`w-4 h-4 mt-0.5 shrink-0 ${agrees ? "text-emerald-600" : "text-amber-600"}`} />
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-semibold ${agrees ? "text-emerald-700" : "text-amber-700"}`}>
                                    {agrees ? "IA concorda" : "IA questiona"}
                                  </span>
                                  {!agrees && (
                                    <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full font-medium">
                                      Sugere: {feedback.suggestedGrade}
                                    </span>
                                  )}
                                </div>
                                <p className={`text-sm leading-relaxed ${agrees ? "text-emerald-900" : "text-amber-900"}`}>
                                  {feedback.reasoning}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        {!isConcluida && (
          <div className="mt-10 mb-8 space-y-4">
            {/* Analyze button */}
            {!hasAnalyzed && (
              <button
                onClick={handleAnalyze}
                disabled={!allAnswersReady || isAnalyzing}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-white rounded-xl hover:bg-primary-dark transition text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analisando todas as respostas...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar para análise da IA
                  </>
                )}
              </button>
            )}

            {!allAnswersReady && !hasAnalyzed && (
              <p className="text-xs text-gray-400 text-center">
                Preencha todas as {questions.length} perguntas (com justificativas para conceitos diferentes de C) para habilitar a análise.
              </p>
            )}

            {/* Post-analysis */}
            {hasAnalyzed && (
              <div className="space-y-4">
                {/* Summary message */}
                {Object.keys(aiFeedback).length === 0 ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-emerald-800">A IA não encontrou problemas nas suas respostas.</p>
                    <p className="text-xs text-emerald-600 mt-1">Pode confirmar e finalizar.</p>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <Bot className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-amber-800">
                      A IA tem {Object.keys(aiFeedback).length} observação(ões). Revise acima e ajuste se necessário.
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setHasAnalyzed(false);
                      setAiFeedback({});
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition text-base font-semibold"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Ajustar e reenviar
                  </button>
                  <button
                    onClick={handleFinalize}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-accent text-white rounded-xl hover:bg-accent/90 transition text-base font-semibold"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Confirmar e finalizar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
