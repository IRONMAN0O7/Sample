import { useQuery } from '@tanstack/react-query';
import { fetchVendors } from '../lib/api';

export function useVendors() {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
    staleTime: 5 * 60 * 1000,
  });
}
