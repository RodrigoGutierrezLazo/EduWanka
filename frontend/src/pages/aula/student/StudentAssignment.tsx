import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Loader, ClipboardList, Upload, CheckCircle, AlertCircle, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Assignment {
  id: number;
  title: string;
  instructions: string;
  due_at?: string | null;
  max_score: number;
}

interface Submission {
  id: number;
  file_path?: string;
  comment?: string;
  score?: number | null;
  feedback?: string | null;
  submitted_at?: string;
  graded_at?: string | null;
}

export default function StudentAssignment() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState('');

  const { data: assignment, isLoading: loadingAssignment } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/aula/assignments/${assignmentId}`);
      return res.data.data as Assignment;
    }
  });

  const { data: submission, isLoading: loadingSubmission } = useQuery({
    queryKey: ['my-submission', assignmentId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/aula/assignments/${assignmentId}/my-submission`);
      return res.data.data as Submission | null;
    }
  });

  const submitMut = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      if (file) fd.append('file', file);
      fd.append('comment', comment);
      const res = await apiClient.post(`/api/v1/aula/assignments/${assignmentId}/submit`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data.data as Submission;
    },
    onSuccess: () => {
      toast.success('¡Tarea entregada exitosamente!');
      queryClient.invalidateQueries({ queryKey: ['my-submission', assignmentId] });
    },
    onError: () => toast.error('Error al enviar la tarea. Inténtalo de nuevo.'),
  });

  if (loadingAssignment || loadingSubmission) {
    return (
      <div className="flex justify-center py-16">
        <Loader className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="bg-red-50 text-red-600 p-8 rounded-3xl text-center">
        <AlertCircle className="w-10 h-10 mx-auto mb-3" />
        <p className="font-bold">Tarea no encontrada.</p>
        <Link to="/aula/cursos" className="mt-4 inline-block text-primary font-bold underline">Volver</Link>
      </div>
    );
  }

  const isGraded = submission?.graded_at != null;
  const isSubmitted = submission?.submitted_at != null;

  const formatDate = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      {/* Back */}
      <Link to="/aula/cursos" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary font-bold transition-colors">
        <ChevronLeft className="w-4 h-4" /> Volver a mis cursos
      </Link>

      {/* Header */}
      <div className="bg-teal-600 text-white rounded-[2rem] p-8 shadow-2xl">
        <ClipboardList className="w-10 h-10 mb-4 opacity-80" />
        <h1 className="text-3xl font-black">{assignment.title}</h1>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-teal-100">
          {assignment.due_at && (
            <span>📅 Fecha límite: <strong>{formatDate(assignment.due_at)}</strong></span>
          )}
          <span>🎯 Puntaje máximo: <strong>{assignment.max_score} pts</strong></span>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-8">
        <h2 className="text-xl font-black text-slate-800 mb-4">Instrucciones</h2>
        <div
          className="prose prose-sm max-w-none text-slate-600"
          dangerouslySetInnerHTML={{ __html: assignment.instructions }}
        />
      </div>

      {/* Grade Result (if graded) */}
      {isGraded && submission && (
        <div className="bg-green-50 rounded-3xl border-2 border-green-200 p-8">
          <CheckCircle className="w-10 h-10 text-green-500 mb-3" />
          <h2 className="text-2xl font-black text-slate-800">
            Calificación: <span className="text-green-600">{submission.score} / {assignment.max_score}</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">Calificado el {formatDate(submission.graded_at)}</p>
          {submission.feedback && (
            <div className="mt-4 p-4 bg-white rounded-2xl border border-green-100">
              <p className="text-xs font-black uppercase text-slate-400 mb-2">Retroalimentación del docente</p>
              <p className="text-slate-700 text-sm">{submission.feedback}</p>
            </div>
          )}
        </div>
      )}

      {/* Submission Status */}
      {isSubmitted && !isGraded && submission && (
        <div className="bg-blue-50 rounded-3xl border-2 border-blue-200 p-8">
          <CheckCircle className="w-10 h-10 text-blue-500 mb-3" />
          <h2 className="text-xl font-black text-blue-800">Tarea entregada</h2>
          <p className="text-sm text-blue-600 mt-1">Entregada el {formatDate(submission.submitted_at)}</p>
          <p className="text-sm text-blue-600 mt-2">Esperando calificación de tu docente...</p>
          {submission.file_path && (
            <a
              href={`/storage/${submission.file_path}`}
              target="_blank" rel="noopener noreferrer" download
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-xl border border-blue-200 text-sm font-bold hover:bg-blue-50 transition-colors"
            >
              Ver mi entrega
            </a>
          )}
        </div>
      )}

      {/* Upload Form (if not graded) */}
      {!isGraded && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-8">
          <h2 className="text-xl font-black text-slate-800 mb-6">
            {isSubmitted ? 'Re-enviar entrega' : 'Entregar tarea'}
          </h2>

          <form onSubmit={(e) => { e.preventDefault(); submitMut.mutate(); }} className="space-y-5">
            {/* File */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">
                Archivo {!isSubmitted && <span className="text-red-500">*</span>}
              </label>
              <input
                type="file"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-teal-600 file:text-white file:font-bold file:cursor-pointer hover:file:bg-teal-700"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar"
                required={!isSubmitted}
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">
                Comentario (opcional)
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm resize-none"
                rows={4}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Describe tu entrega o agrega notas para el docente..."
              />
            </div>

            <button
              type="submit"
              disabled={submitMut.isPending}
              className="w-full py-4 bg-teal-600 text-white font-black text-base rounded-2xl hover:bg-teal-700 disabled:opacity-50 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              {submitMut.isPending ? 'Enviando...' : isSubmitted ? 'Re-enviar tarea' : 'Enviar tarea'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
