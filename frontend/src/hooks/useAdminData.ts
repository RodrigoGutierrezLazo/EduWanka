import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { AdminData } from '@/lib/types';

export function useAdminData() {
  return useQuery({
    queryKey: ['adminData'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/aula/admin-data');
      return response.data as AdminData;
    },
    enabled: true,
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });
}
