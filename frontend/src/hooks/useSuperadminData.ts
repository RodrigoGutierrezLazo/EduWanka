import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { User, Course, Purchase } from '@/lib/types';

export interface SuperadminData {
  summary: {
    total_users: number;
    students: number;
    professors: number;
    total_courses: number;
    total_purchases: number;
    total_revenue: number;
    pending_revenue: number;
    total_certificates: number;
  };
  recent_users: User[];
  recent_courses: Course[];
  recent_purchases: Purchase[];
  purchases_by_status: Record<string, number>;
  financials: {
    by_method: { payment_method: string; total: number }[];
    by_entity: { bank_entity: string; total: number }[];
    trend: { month: string; total: number }[];
  };
}

export function useSuperadminData() {
  return useQuery({
    queryKey: ['superadminData'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/aula/superadmin-data');
      return response.data as SuperadminData;
    },
    refetchInterval: 60000, // Refrescar cada 60 segundos
  });
}
