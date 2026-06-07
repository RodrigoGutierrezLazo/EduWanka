import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Course, ExamAttempt, Certificate } from '@/lib/types';
import { User } from '@/lib/types';

export interface ProfessorData {
  user: User;
  courses: Course[];
  student_exams: Array<ExamAttempt & { user: User }>;
  certificates_pending: Certificate[];
  stats: {
    total_students: number;
    exams_pending_review: number;
    students_passed: number;
    avg_score: number;
  };
}

export function useProfessorData() {
  return useQuery({
    queryKey: ['professorData'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/aula/professor-data');
      return response.data as ProfessorData;
    },
  });
}
