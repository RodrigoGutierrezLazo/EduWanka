import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/lib/apiClient';
import { logger } from '@/lib/logger';
import type { ContentType, ContentItem } from '@/lib/types';

// ─── Shared Form Field ───────────────────────────────────────────────────────

const Field: React.FC<{ label: string; children: React.ReactNode; required?: boolean }> = ({
  label, children, required
}) => (
  <div>
    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all";
const textareaCls = `${inputCls} resize-none`;

// ─── Base Props ──────────────────────────────────────────────────────────────

export interface ContentFormProps {
  initial?: Partial<ContentItem>;
  onSubmit: (data: FormData | Record<string, unknown>) => void;
  loading?: boolean;
}

// ─── URL-based forms (video, meet, url) ─────────────────────────────────────

const UrlBasedForm: React.FC<ContentFormProps & { typePlaceholder: string }> = ({
  initial, onSubmit, loading, typePlaceholder
}) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, url });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Título" required>
        <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Clase 1 — Introducción" required />
      </Field>
      <Field label="URL" required>
        <input className={inputCls} type="url" value={url as string} onChange={e => setUrl(e.target.value)} placeholder={typePlaceholder} required />
      </Field>
      <SubmitButton loading={loading} />
    </form>
  );
};

export const VideoForm: React.FC<ContentFormProps> = (props) => (
  <UrlBasedForm {...props} typePlaceholder="https://www.youtube.com/watch?v=..." />
);

export const MeetForm: React.FC<ContentFormProps> = (props) => (
  <UrlBasedForm {...props} typePlaceholder="https://meet.google.com/abc-defg-hij" />
);

export const UrlForm: React.FC<ContentFormProps> = (props) => (
  <UrlBasedForm {...props} typePlaceholder="https://ejemplo.com/recurso" />
);

// ─── File Form ───────────────────────────────────────────────────────────────

export const FileForm: React.FC<ContentFormProps> = ({ initial, onSubmit, loading }) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', title);
    fd.append('type', 'file');
    if (file) fd.append('file', file);
    onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Título" required>
        <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Guía de Estudio Semana 1" required />
      </Field>
      <Field label="Archivo (máx. 50 MB)" required>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white file:font-bold file:cursor-pointer hover:file:bg-primary/80 transition-all"
          required={!initial?.path}
        />
        {initial?.path && (
          <p className="text-xs text-slate-400 mt-1">Archivo actual: <code className="text-primary">{initial.path}</code></p>
        )}
      </Field>
      <SubmitButton loading={loading} />
    </form>
  );
};

// ─── Text Form ───────────────────────────────────────────────────────────────

export const TextForm: React.FC<ContentFormProps> = ({ initial, onSubmit, loading }) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [bodyHtml, setBodyHtml] = useState(initial?.body_html ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, body_html: bodyHtml });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Título" required>
        <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Introducción a la Unidad" required />
      </Field>
      <Field label="Contenido HTML">
        <textarea
          className={textareaCls}
          rows={8}
          value={bodyHtml}
          onChange={e => setBodyHtml(e.target.value)}
          placeholder="<p>Escribe el contenido aquí o pega HTML...</p>"
        />
        <p className="text-xs text-slate-400 mt-1">Tip: Puedes pegar HTML directamente desde Word/Google Docs.</p>
      </Field>
      <SubmitButton loading={loading} />
    </form>
  );
};

// ─── Reference-based forms (exam, questionnaire, substitute_exam, assignment) ─

const ReferenceForm: React.FC<ContentFormProps & {
  refLabel: string;
  refPlaceholder: string;
}> = ({ initial, onSubmit, loading, refLabel, refPlaceholder }) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [referencedId, setReferencedId] = useState<string>(
    initial?.referenced_id?.toString() ?? ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, referenced_id: parseInt(referencedId) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Título del ítem" required>
        <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Examen Final" required />
      </Field>
      <Field label={refLabel} required>
        <input
          className={inputCls}
          type="number"
          min={1}
          value={referencedId}
          onChange={e => setReferencedId(e.target.value)}
          placeholder={refPlaceholder}
          required
        />
        <p className="text-xs text-slate-400 mt-1">{refPlaceholder}</p>
      </Field>
      <SubmitButton loading={loading} />
    </form>
  );
};

export const QuestionnaireInlineForm: React.FC<ContentFormProps & { isSubstitute?: boolean }> = ({ initial, onSubmit, loading, isSubstitute }) => {
  const { courseId } = useParams<{ courseId: string }>();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [passingScore, setPassingScore] = useState(initial?.resolved?.passing_score ?? 60);
  const [maxAttempts, setMaxAttempts] = useState(initial?.resolved?.max_attempts ?? 3);
  const [dueDate, setDueDate] = useState(initial?.resolved?.due_date ? String(initial.resolved.due_date).substring(0, 16) : '');
  const [originalQuestionnaireId, setOriginalQuestionnaireId] = useState<number | ''>(
    (initial?.resolved?.original_questionnaire_id as number) ?? ''
  );
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCourseId = parseInt(courseId!);
    if (!initial?.referenced_id) {
      setIsCreating(true);
      try {
        const endpoint = isSubstitute ? '/api/v1/aula/substitute-exams' : '/api/v1/aula/questionnaires';
        const payload: any = {
          course_id: parsedCourseId,
          title,
          passing_score: Number(passingScore),
          max_attempts: Number(maxAttempts) || null,
          due_date: dueDate ? dueDate : null,
        };
        if (isSubstitute) payload.original_questionnaire_id = Number(originalQuestionnaireId);

        const res = await apiClient.post(endpoint, payload);
        onSubmit({ title, referenced_id: res.data.data.id });
      } catch (err) {
        logger.error(err);
      } finally {
        setIsCreating(false);
      }
    } else {
      // update existing
      setIsCreating(true);
      try {
        const endpoint = isSubstitute ? `/api/v1/aula/substitute-exams/${initial.referenced_id}` : `/api/v1/aula/questionnaires/${initial.referenced_id}`;
        const payload: any = {
          title,
          passing_score: Number(passingScore),
          max_attempts: Number(maxAttempts) || null,
          due_date: dueDate ? dueDate : null,
        };
        if (isSubstitute) payload.original_questionnaire_id = Number(originalQuestionnaireId);
        
        await apiClient.put(endpoint, payload);
        onSubmit({ title, referenced_id: initial.referenced_id });
      } catch (err) {
        logger.error(err);
      } finally {
        setIsCreating(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isSubstitute && (
        <Field label="ID del Cuestionario a Sustituir" required>
          <input className={inputCls} type="number" value={originalQuestionnaireId} onChange={e => setOriginalQuestionnaireId(e.target.value ? Number(e.target.value) : '')} placeholder="Ej: 15" required />
        </Field>
      )}
      <Field label={isSubstitute ? "Título del Sustitutorio" : "Título del Cuestionario"} required>
        <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Examen Final" required />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nota Aprobatoria" required>
          <input className={inputCls} type="number" min={0} max={100} value={passingScore as number} onChange={e => setPassingScore(Number(e.target.value))} required />
        </Field>
        <Field label="Intentos Permitidos (Opcional)">
          <input className={inputCls} type="number" min={1} value={maxAttempts as number} onChange={e => setMaxAttempts(Number(e.target.value))} placeholder="Sin límite" />
        </Field>
      </div>
      <Field label="Fecha de Vencimiento (Opcional)">
        <input className={inputCls} type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} />
      </Field>
      <SubmitButton loading={loading || isCreating} />
    </form>
  );
};

export const QuestionnaireForm: React.FC<ContentFormProps> = (props) => (
  <QuestionnaireInlineForm {...props} isSubstitute={false} />
);

export const SubstituteExamForm: React.FC<ContentFormProps> = (props) => (
  <QuestionnaireInlineForm {...props} isSubstitute={true} />
);

export const AssignmentForm: React.FC<ContentFormProps> = (props) => (
  <ReferenceForm {...props} refLabel="ID de la Tarea" refPlaceholder="Ingresa el ID de la tarea existente" />
);

// ─── Registry ────────────────────────────────────────────────────────────────

export const CONTENT_FORM_MAP: Record<ContentType, React.FC<ContentFormProps>> = {
  video:           VideoForm,
  file:            FileForm,
  meet:            MeetForm,
  text:            TextForm,
  url:             UrlForm,
  questionnaire:   QuestionnaireForm,
  substitute_exam: SubstituteExamForm,
  assignment:      AssignmentForm,
};

// ─── Shared Submit Button ────────────────────────────────────────────────────

const SubmitButton: React.FC<{ loading?: boolean }> = ({ loading }) => (
  <button
    type="submit"
    disabled={loading}
    className="w-full py-3 bg-primary text-white font-black uppercase text-sm tracking-widest rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
  >
    {loading ? 'Guardando...' : 'Guardar'}
  </button>
);
