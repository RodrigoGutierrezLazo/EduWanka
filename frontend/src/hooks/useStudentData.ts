import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export function useStudentData() {
  return useQuery({
    queryKey: ['studentData'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/aula/student-data');
      return response.data;
    },
    enabled: true,
  });
}
