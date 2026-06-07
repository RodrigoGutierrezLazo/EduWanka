import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export interface SystemMetrics {
  certificates: {
    total: number;
    by_status: Record<string, number>;
    by_course: { course_title: string; count: number; avg_score: number | null }[];
    monthly_trend: { month: string; count: number }[];
  };
  exams: {
    total_attempts: number;
    passed: number;
    pass_rate: number;
    avg_score: number | null;
    by_course: {
      course_title: string;
      total_attempts: number;
      passed: number;
      pass_rate: number;
      avg_score: number | null;
    }[];
  };
  platform: {
    total_courses: number;
    published_courses: number;
    total_enrollments: number;
    top_courses: { title: string; enrollments: number }[];
    users_trend: { month: string; count: number }[];
    certificates_trend: { month: string; count: number }[];
  };
}

export function useSystemMetrics() {
  return useQuery<SystemMetrics>({
    queryKey: ['systemMetrics'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/aula/superadmin-metrics');
      return res.data as SystemMetrics;
    },
    refetchInterval: 120000,
  });
}
