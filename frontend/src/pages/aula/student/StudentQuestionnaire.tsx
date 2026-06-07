import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Loader, HelpCircle, CheckCircle, XCircle, AlertCircle, ChevronLeft } from 'lucide-react';

interface QuestionOption {
  id: number;
  option_text: string;
  is_correct?: boolean;
  feedback?: string;
}

interface Question {
  id: number;
  question_text: string;
  type: 'single' | 'multiple' | 'true_false';
  points: number;
  order: number;
  explanation?: string;
  options: QuestionOption[];
}

interface Questionnaire {
  id: number;
  title: string;
  description?: string;
  passing_score?: number;
  max_attempts?: number;
  immediate_feedback: boolean;
  questions: Question[];
}

interface AttemptResult {
  score: number;
  passed: boolean | null;
  feedback?: Record<number, { is_correct: boolean; explanation?: string; correct_ids: number[] }>;
}

export default function StudentQuestionnaire() {
  const { questionnaireId } = useParams<{ questionnaireId: string }>();
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { data: questionnaire, isLoading, error } = useQuery({
    queryKey: ['questionnaire', questionnaireId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/aula/questionnaires/${questionnaireId}`);
      return res.data.data as Questionnaire;
    }
  });

  const submitMut = useMutation({
    mutationFn: async (answersPayload: Record<number, number[]>) => {
      const res = await apiClient.post(`/api/v1/aula/questionnaires/${questionnaireId}/attempt`, {
        answers: answersPayload,
      });
      return res.data as AttemptResult;
    },
    onSuccess: (data) => {
      setResult(data);
      setSubmitted(true);
    },
  });

  const toggleOption = (questionId: number, optionId: number, type: Question['type']) => {
    setAnswers(prev => {
      const current = prev[questionId] ?? [];
      if (type === 'single' || type === 'true_false') {
        return { ...prev, [questionId]: [optionId] };
      }
      // multiple
      if (current.includes(optionId)) {
        return { ...prev, [questionId]: current.filter(id => id !== optionId) };
      }
      return { ...prev, [questionId]: [...current, optionId] };
    });
  };

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <Loader className="animate-spin text-primary w-8 h-8" />
    </div>
  );

  if (error || !questionnaire) {
    return (
      <div className="bg-red-50 text-red-600 p-8 rounded-3xl text-center">
        <AlertCircle className="w-10 h-10 mx-auto mb-3" />
        <p className="font-bold">No se pudo cargar el cuestionario.</p>
        <Link to="/aula" className="mt-4 inline-block text-primary font-bold underline">Volver al Aula</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Back */}
      <Link to="/aula/cursos" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary font-bold transition-colors">
        <ChevronLeft className="w-4 h-4" /> Volver a mis cursos
      </Link>

      {/* Header */}
      <div className="bg-indigo-600 text-white rounded-[2rem] p-8 shadow-2xl">
        <HelpCircle className="w-10 h-10 mb-4 opacity-80" />
        <h1 className="text-3xl font-black">{questionnaire.title}</h1>
        {questionnaire.description && (
          <p className="mt-2 text-indigo-100 text-sm">{questionnaire.description}</p>
        )}
        <div className="mt-4 flex gap-4 text-sm text-indigo-100">
          <span>{questionnaire.questions.length} preguntas</span>
          {questionnaire.passing_score && <span>· Aprobación: {questionnaire.passing_score}%</span>}
          {questionnaire.max_attempts && <span>· Máx. {questionnaire.max_attempts} intentos</span>}
        </div>
      </div>

      {/* Result Banner */}
      {result && (
        <div className={`rounded-3xl p-8 border-2 text-center ${
          result.passed === true ? 'bg-green-50 border-green-200' :
          result.passed === false ? 'bg-red-50 border-red-200' :
          'bg-slate-50 border-slate-200'
        }`}>
          {result.passed === true
            ? <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            : result.passed === false
            ? <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            : <CheckCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          }
          <h2 className="text-2xl font-black text-slate-800">
            Puntaje: {result.score}%
          </h2>
          {result.passed !== null && (
            <p className={`mt-2 font-bold text-lg ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
              {result.passed ? '¡Aprobado!' : 'No aprobado'}
            </p>
          )}
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {questionnaire.questions.sort((a, b) => a.order - b.order).map((question, idx) => {
          const selectedOpts = answers[question.id] ?? [];
          const fb = result?.feedback?.[question.id];

          return (
            <div key={question.id} className={`bg-white rounded-3xl border-2 p-6 shadow-soft transition-all ${
              fb
                ? fb.is_correct ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'
                : 'border-slate-100'
            }`}>
              {/* Question */}
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center text-sm font-black">
                  {idx + 1}
                </span>
                <p className="font-bold text-slate-800 text-base leading-snug">{question.question_text}</p>
              </div>

              {/* Feedback icon */}
              {fb && (
                <div className={`flex items-center gap-2 mb-3 text-sm font-bold ${fb.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                  {fb.is_correct
                    ? <><CheckCircle className="w-4 h-4" /> Correcto</>
                    : <><XCircle className="w-4 h-4" /> Incorrecto</>
                  }
                </div>
              )}

              {/* Options */}
              <div className="space-y-2">
                {question.options.map(option => {
                  const isSelected = selectedOpts.includes(option.id);
                  const isCorrectOpt = fb?.correct_ids.includes(option.id);

                  let optCls = 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50';
                  if (submitted) {
                    if (isCorrectOpt) optCls = 'border-green-400 bg-green-50';
                    else if (isSelected && !isCorrectOpt) optCls = 'border-red-400 bg-red-50';
                  } else if (isSelected) {
                    optCls = 'border-indigo-500 bg-indigo-50';
                  }

                  return (
                    <button
                      key={option.id}
                      disabled={submitted}
                      onClick={() => toggleOption(question.id, option.id, question.type)}
                      className={`w-full text-left flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${optCls} ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className={`w-5 h-5 rounded-${question.type === 'multiple' ? 'md' : 'full'} border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{option.option_text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {fb?.explanation && (
                <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800">
                  <strong>Explicación:</strong> {fb.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit */}
      {!submitted && (
        <button
          onClick={() => submitMut.mutate(answers)}
          disabled={submitMut.isPending}
          className="w-full py-4 bg-indigo-600 text-white font-black text-lg rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl hover:shadow-2xl"
        >
          {submitMut.isPending ? 'Enviando...' : 'Enviar respuestas'}
        </button>
      )}

      {submitted && (
        <Link
          to="/aula/cursos"
          className="block w-full py-4 bg-slate-800 text-white font-black text-lg rounded-2xl hover:bg-slate-700 transition-all text-center shadow-xl"
        >
          Volver a mis cursos
        </Link>
      )}
    </div>
  );
}
