import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ArrowLeft, Plus, Trash2, Save, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface OptionData {
  id?: number;
  option_text: string;
  is_correct: boolean;
}

interface QuestionData {
  id?: number;
  question_text: string;
  points: number;
  order: number;
  options: OptionData[];
}

export default function QuestionnaireBuilder() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();

  const isSubstitute = type === 'substitute_exam';
  const endpoint = isSubstitute ? `/api/v1/aula/substitute-exams/${id}` : `/api/v1/aula/questionnaires/${id}`;

  const [questions, setQuestions] = useState<QuestionData[]>([]);

  const { data: questionnaire, isLoading } = useQuery({
    queryKey: ['questionnaire', type, id],
    queryFn: async () => {
      const res = await apiClient.get(endpoint);
      const q = res.data.data;
      if (q.questions) {
        setQuestions(q.questions);
      }
      return q;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedQuestions: QuestionData[]) => {
      return await apiClient.put(endpoint, {
        questions: updatedQuestions,
      });
    },
    onSuccess: () => {
      toast.success('Preguntas guardadas correctamente');
      navigate(-1);
    },
    onError: () => {
      toast.error('Error al guardar las preguntas');
    },
  });

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        points: 1,
        order: questions.length + 1,
        options: [
          { option_text: '', is_correct: true },
          { option_text: '', is_correct: false },
        ],
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    const newQ = [...questions];
    newQ.splice(index, 1);
    setQuestions(newQ);
  };

  const updateQuestion = (index: number, field: keyof QuestionData, value: any) => {
    const newQ = [...questions];
    newQ[index] = { ...newQ[index], [field]: value };
    setQuestions(newQ);
  };

  const addOption = (qIndex: number) => {
    const newQ = [...questions];
    newQ[qIndex].options.push({ option_text: '', is_correct: false });
    setQuestions(newQ);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQ = [...questions];
    newQ[qIndex].options.splice(oIndex, 1);
    setQuestions(newQ);
  };

  const updateOption = (qIndex: number, oIndex: number, field: keyof OptionData, value: any) => {
    const newQ = [...questions];
    
    // If setting is_correct to true, we might want to make it single-choice by unchecking others
    if (field === 'is_correct' && value === true) {
      newQ[qIndex].options = newQ[qIndex].options.map((opt, i) => ({
        ...opt,
        is_correct: i === oIndex,
      }));
    } else {
      newQ[qIndex].options[oIndex] = { ...newQ[qIndex].options[oIndex], [field]: value };
    }
    
    setQuestions(newQ);
  };

  const handleSave = () => {
    // Validate
    for (const q of questions) {
      if (!q.question_text.trim()) {
        toast.error('Todas las preguntas deben tener texto');
        return;
      }
      if (q.options.length < 2) {
        toast.error('Cada pregunta debe tener al menos 2 opciones');
        return;
      }
      if (!q.options.some(o => o.is_correct)) {
        toast.error('Cada pregunta debe tener al menos una opción correcta');
        return;
      }
    }

    updateMutation.mutate(questions.map((q, idx) => ({ ...q, order: idx + 1 })));
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Gestionar Preguntas
            </h1>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              {questionnaire?.title}
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                Total: {questions.reduce((sum, q) => sum + (q.points || 0), 0)} pts
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors font-semibold"
        >
          {updateMutation.isPending ? 'Guardando...' : (
            <>
              <Save className="w-4 h-4" />
              Guardar Cambios
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold shrink-0">
                    {qIndex + 1}
                  </span>
                  <input
                    type="text"
                    value={q.question_text}
                    onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                    placeholder="Escribe la pregunta..."
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-xs font-semibold text-slate-500">Puntos:</label>
                    <input
                      type="number"
                      min={1}
                      value={q.points}
                      onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 1)}
                      className="w-20 px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pl-12 space-y-3">
                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`correct_${qIndex}`}
                        checked={opt.is_correct}
                        onChange={(e) => updateOption(qIndex, oIndex, 'is_correct', e.target.checked)}
                        className="w-4 h-4 text-primary focus:ring-primary"
                      />
                      <input
                        type="text"
                        value={opt.option_text}
                        onChange={(e) => updateOption(qIndex, oIndex, 'option_text', e.target.value)}
                        placeholder={`Opción ${oIndex + 1}`}
                        className={`flex-1 px-3 py-2 border rounded-lg outline-none transition-all ${
                          opt.is_correct 
                            ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-2 focus:ring-green-200' 
                            : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
                        }`}
                      />
                      <button
                        onClick={() => removeOption(qIndex, oIndex)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={q.options.length <= 2}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(qIndex)}
                    className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Opción
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => removeQuestion(qIndex)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={addQuestion}
          className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center gap-2 text-slate-500 font-semibold hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
        >
          <Plus className="w-5 h-5" />
          Añadir Nueva Pregunta
        </button>
      </div>
    </div>
  );
}
