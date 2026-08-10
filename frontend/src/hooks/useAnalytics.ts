import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AnalyticsSummary } from '@/types/analytics';

export function useAnalytics() {
  return useQuery<AnalyticsSummary>({
    queryKey: ['analytics'],
    queryFn: () => api.get<AnalyticsSummary>('/api/analytics/summary'),
  });
}
