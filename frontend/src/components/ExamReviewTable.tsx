import { ExamAttempt } from '@/lib/types';
import { Check, X } from 'lucide-react';

interface ExamReviewTableProps {
  exams: (ExamAttempt & { user: any })[];
  onGradeClick?: (examId: number) => void;
}

export function ExamReviewTable({ exams, onGradeClick }: ExamReviewTableProps) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold">Estudiante</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">Curso</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">Puntaje</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">Estado</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {exams.map((exam) => (
            <tr key={exam.id} className="border-b border-slate-200 hover:bg-slate-50">
              <td className="px-6 py-4">
                <div>
                  <p className="font-semibold">{exam.user?.name}</p>
                  <p className="text-sm text-slate-500">{exam.user?.email}</p>
                </div>
              </td>
              <td className="px-6 py-4">{exam.course?.title}</td>
              <td className="px-6 py-4 font-bold text-lg">{exam.score}%</td>
              <td className="px-6 py-4">
                {exam.passed ? (
                  <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded w-fit">
                    <Check className="w-4 h-4" /> Aprobado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded w-fit">
                    <X className="w-4 h-4" /> No aprobado
                  </span>
                )}
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => onGradeClick?.(exam.id)}
                  className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary-dark"
                >
                  Ver Detalle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
