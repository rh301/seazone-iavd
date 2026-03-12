"use client";

import { useEffect, useState } from "react";
import { Question, ScaleLevel } from "@/lib/types";
import { getQuestions, saveQuestion, deleteQuestion } from "@/lib/store";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { canManageQuestions } from "@/lib/permissions";
import AppShell from "@/components/app-shell";

export default function AdminPerguntas() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    setQuestions(getQuestions());
  }, []);

  if (!user || !canManageQuestions(user)) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <ShieldAlert className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900">Sem permissão</h2>
          <p className="text-gray-500 mt-1">
            Apenas C-Level, RH e Diretores podem gerenciar perguntas.
          </p>
        </div>
      </AppShell>
    );
  }

  function handleDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir esta pergunta?")) {
      deleteQuestion(id);
      setQuestions(getQuestions());
    }
  }

  return (
    <AppShell>
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Perguntas da Avaliação
          </h1>
          <p className="text-gray-500 mt-1">
            Configure os critérios e a interpretação da diretoria para cada nota
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary-dark transition font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Pergunta
        </button>
      </div>

      {showNewForm && (
        <QuestionForm
          onSave={(q) => {
            saveQuestion(q);
            setQuestions(getQuestions());
            setShowNewForm(false);
          }}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      <div className="space-y-4">
        {questions.map((q) => (
          <div
            key={q.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100"
          >
            {editingId === q.id ? (
              <div className="p-6">
                <QuestionForm
                  initial={q}
                  onSave={(updated) => {
                    saveQuestion(updated);
                    setQuestions(getQuestions());
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <>
                <div
                  className="p-6 flex items-center justify-between cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === q.id ? null : q.id)
                  }
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-medium px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                      {q.category}
                    </span>
                    <h3 className="font-semibold text-gray-900">{q.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(q.id);
                      }}
                      className="p-2 text-gray-400 hover:text-primary transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(q.id);
                      }}
                      className="p-2 text-gray-400 hover:text-danger transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {expandedId === q.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
                {expandedId === q.id && (
                  <div className="px-6 pb-6 border-t border-gray-50 pt-4">
                    <p className="text-sm text-gray-500 mb-4">
                      {q.description}
                    </p>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Escala — Interpretação da Diretoria
                    </h4>
                    <div className="space-y-3">
                      {q.scale.map((level) => (
                        <div
                          key={level.score}
                          className={`p-4 rounded-lg border-l-4 score-${level.score}-light`}
                        >
                          <div className="flex items-center gap-3 mb-1">
                            <span
                              className={`score-${level.score} w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold`}
                            >
                              {level.score}
                            </span>
                            <span className="font-medium text-gray-800">
                              {level.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 ml-10">
                            {level.description}
                          </p>
                          {level.examples.length > 0 && (
                            <ul className="mt-2 ml-10 space-y-1">
                              {level.examples.map((ex, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-gray-500 flex items-start gap-1.5"
                                >
                                  <span className="mt-1.5 w-1 h-1 bg-gray-400 rounded-full shrink-0" />
                                  {ex}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
    </AppShell>
  );
}

function QuestionForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Question;
  onSave: (q: Question) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [category, setCategory] = useState(initial?.category || "Valores");
  const [description, setDescription] = useState(initial?.description || "");
  const [scale, setScale] = useState<ScaleLevel[]>(
    initial?.scale || [1, 2, 3, 4, 5].map((s) => ({
      score: s,
      label: "",
      description: "",
      examples: [""],
    }))
  );

  function updateScale(index: number, field: keyof ScaleLevel, value: string) {
    const updated = [...scale];
    if (field === "examples") {
      updated[index] = { ...updated[index], examples: value.split("\n").filter(Boolean) };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setScale(updated);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id: initial?.id || `q_${Date.now()}`,
      title,
      category,
      description,
      scale,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {initial ? "Editar Pergunta" : "Nova Pergunta"}
        </h3>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="Ex: Colaboração entre áreas"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option>Valores</option>
            <option>Performance</option>
            <option>Comportamento</option>
            <option>Técnico</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="Descreva o que esse critério avalia"
        />
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Escala de Notas — Interpretação da Diretoria
        </h4>
        <div className="space-y-4">
          {scale.map((level, i) => (
            <div key={level.score} className={`p-4 rounded-lg border border-gray-200 score-${level.score}-light`}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`score-${level.score} w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold`}>
                  {level.score}
                </span>
                <input
                  type="text"
                  value={level.label}
                  onChange={(e) => updateScale(i, "label", e.target.value)}
                  className="px-2 py-1 border border-gray-200 rounded text-sm font-medium w-40"
                  placeholder="Label (ex: Insuficiente)"
                />
              </div>
              <div className="ml-10 space-y-2">
                <textarea
                  value={level.description}
                  onChange={(e) => updateScale(i, "description", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="Descrição do que a diretoria espera para essa nota"
                />
                <textarea
                  value={level.examples.join("\n")}
                  onChange={(e) => updateScale(i, "examples", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="Exemplos de comportamento (um por linha)"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition"
        >
          <Save className="w-4 h-4" />
          Salvar
        </button>
      </div>
    </form>
  );
}
