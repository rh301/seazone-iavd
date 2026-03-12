"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Evaluation, Question, CalibrationEntry } from "@/lib/types";
import { getEvaluation, getQuestions, saveEvaluation } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { canCalibrate } from "@/lib/permissions";
import { users as allUsers } from "@/data/users";
import { roleLabels } from "@/lib/auth-types";
import { formatChatContent } from "@/lib/format-chat";
import AppShell from "@/components/app-shell";
import {
  ChevronLeft,
  Scale,
  Save,
  CheckCircle2,
  Bot,
  User,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Undo2,
} from "lucide-react";

export default function CalibracaoDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [calibrations, setCalibrations] = useState<
    Record<string, CalibrationEntry>
  >({});
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const eval_ = getEvaluation(id);
    if (!eval_ || (eval_.status !== "concluida" && eval_.status !== "calibrada")) {
      router.push("/calibracao");
      return;
    }
    setEvaluation(eval_);
    setQuestions(getQuestions());

    // Carregar calibrações existentes
    if (eval_.calibration?.entries) {
      setCalibrations(eval_.calibration.entries);
    }
  }, [id, router]);

  if (!evaluation || !currentUser) return null;

  if (!canCalibrate(currentUser)) {
    router.push("/");
    return null;
  }

  const employee = allUsers.find((u) => u.id === evaluation.employeeId);
  const evaluator = allUsers.find((u) => u.id === evaluation.evaluatorId);

  const scores = evaluation.answers
    .map((a) => a.score)
    .filter((s): s is number => s !== null);
  const avgOriginal =
    scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

  // Calcular média calibrada
  const calibratedScores = evaluation.answers
    .map((a) => {
      const cal = calibrations[a.questionId];
      return cal ? cal.calibratedScore : a.score;
    })
    .filter((s): s is number => s !== null);
  const avgCalibrated =
    calibratedScores.length > 0
      ? calibratedScores.reduce((a, b) => a + b, 0) / calibratedScores.length
      : 0;

  const hasChanges = Object.keys(calibrations).some((qId) => {
    const answer = evaluation.answers.find((a) => a.questionId === qId);
    return (
      answer &&
      calibrations[qId].calibratedScore !== answer.score
    );
  });

  function updateCalibration(
    questionId: string,
    originalScore: number,
    calibratedScore: number,
    comment: string
  ) {
    setCalibrations((prev) => ({
      ...prev,
      [questionId]: {
        originalScore,
        calibratedScore,
        comment,
        calibratedBy: currentUser!.id,
        calibratedAt: new Date().toISOString(),
      },
    }));
    setSaved(false);
  }

  function resetCalibration(questionId: string) {
    setCalibrations((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    setSaved(false);
  }

  function handleSave() {
    if (!evaluation) return;

    const updated: Evaluation = {
      ...evaluation,
      status: "calibrada",
      calibration: {
        entries: calibrations,
        calibratedBy: currentUser!.id,
        calibratedAt: new Date().toISOString(),
      },
    };
    saveEvaluation(updated);
    setEvaluation(updated);
    setSaved(true);
  }

  return (
    <AppShell>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/calibracao")}
              className="text-gray-400 hover:text-gray-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                Calibrar — {employee?.name}
              </h1>
              <p className="text-sm text-gray-500">
                {employee ? roleLabels[employee.role] : ""} ·{" "}
                {employee?.department} · Avaliado por {evaluator?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-accent">
                <CheckCircle2 className="w-4 h-4" />
                Salvo
              </span>
            )}
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              Salvar calibração
            </button>
          </div>
        </div>

        {/* Resumo comparativo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
            <p className="text-3xl font-bold text-gray-400">
              {avgOriginal > 0 ? avgOriginal.toFixed(1) : "—"}
            </p>
            <p className="text-sm text-gray-500 mt-1">Média original</p>
          </div>
          <div
            className={`rounded-xl p-5 shadow-sm border text-center ${
              hasChanges
                ? "bg-primary/5 border-primary/20"
                : "bg-white border-gray-100"
            }`}
          >
            <p className="text-3xl font-bold text-primary">
              {avgCalibrated > 0 ? avgCalibrated.toFixed(1) : "—"}
            </p>
            <p className="text-sm text-gray-500 mt-1">Média calibrada</p>
          </div>
        </div>

        {/* Critérios */}
        <div className="space-y-4">
          {questions.map((q) => {
            const answer = evaluation.answers.find(
              (a) => a.questionId === q.id
            );
            if (!answer || answer.score === null) return null;

            const cal = calibrations[q.id];
            const currentScore = cal ? cal.calibratedScore : answer.score;
            const isModified = cal && cal.calibratedScore !== answer.score;
            const isExpanded = expandedQuestion === q.id;
            const scaleLevel = q.scale.find((s) => s.score === answer.score);
            const calibratedLevel = q.scale.find(
              (s) => s.score === currentScore
            );
            const hasChat =
              answer.chatHistory && answer.chatHistory.length > 0;

            return (
              <div
                key={q.id}
                className={`bg-white rounded-xl shadow-sm border ${
                  isModified ? "border-primary/30" : "border-gray-100"
                }`}
              >
                {/* Cabeçalho colapsável */}
                <button
                  onClick={() =>
                    setExpandedQuestion(isExpanded ? null : q.id)
                  }
                  className="w-full p-5 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          isModified
                            ? "bg-gray-200 text-gray-500 line-through"
                            : `score-${answer.score}`
                        }`}
                      >
                        {answer.score}
                      </span>
                      {isModified && (
                        <>
                          <span className="text-gray-400">→</span>
                          <span
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold score-${currentScore}`}
                          >
                            {currentScore}
                          </span>
                        </>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {q.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          {q.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {calibratedLevel?.label || scaleLevel?.label}
                        </span>
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

                {/* Conteúdo expandido */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-5">
                    {/* Interpretação original */}
                    {scaleLevel && (
                      <div
                        className={`p-4 rounded-lg border-l-4 score-${answer.score}-light`}
                      >
                        <p className="text-xs font-semibold text-gray-500 mb-1">
                          Nota original: {answer.score} ({scaleLevel.label})
                        </p>
                        <p className="text-sm text-gray-700">
                          {scaleLevel.description}
                        </p>
                      </div>
                    )}

                    {/* Justificativa do gestor */}
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

                    {/* Chat com IA (colapsado) */}
                    {hasChat && (
                      <details className="group">
                        <summary className="text-sm font-semibold text-gray-700 cursor-pointer flex items-center gap-2">
                          <Bot className="w-4 h-4 text-primary" />
                          Conversa com a IA ({answer.chatHistory.length}{" "}
                          mensagens)
                        </summary>
                        <div className="mt-3 space-y-3 max-h-60 overflow-y-auto">
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
                      </details>
                    )}

                    {/* Calibração */}
                    <div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
                      <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                        <Scale className="w-4 h-4" />
                        Ajustar nota
                      </h4>
                      <div className="flex gap-2 mb-3">
                        {q.scale.map((level) => (
                          <button
                            key={level.score}
                            onClick={() =>
                              updateCalibration(
                                q.id,
                                answer.score!,
                                level.score,
                                cal?.comment || ""
                              )
                            }
                            className={`flex-1 p-3 rounded-lg border-2 text-center transition ${
                              currentScore === level.score
                                ? `score-${level.score}-light border-2`
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block w-8 h-8 rounded-full text-sm font-bold leading-8 ${
                                currentScore === level.score
                                  ? `score-${level.score}`
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {level.score}
                            </span>
                            <p className="text-xs text-gray-600 mt-1">
                              {level.label}
                            </p>
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={cal?.comment || ""}
                        onChange={(e) =>
                          updateCalibration(
                            q.id,
                            answer.score!,
                            currentScore,
                            e.target.value
                          )
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="Justificativa da calibração (opcional)..."
                      />
                      {isModified && (
                        <button
                          onClick={() => resetCalibration(q.id)}
                          className="flex items-center gap-1.5 mt-2 text-xs text-gray-500 hover:text-gray-700"
                        >
                          <Undo2 className="w-3 h-3" />
                          Restaurar nota original ({answer.score})
                        </button>
                      )}
                    </div>
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
