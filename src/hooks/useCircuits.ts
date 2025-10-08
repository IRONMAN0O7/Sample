import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCircuits, fetchCircuitHistory, runY1731Test } from '../lib/api';
import type { CircuitFilters } from '../types/circuit';

export function useCircuits(vendorId?: string, filters?: CircuitFilters) {
  return useQuery({
    queryKey: ['circuits', vendorId, filters],
    queryFn: () => fetchCircuits(vendorId, filters),
    staleTime: 30 * 1000,
  });
}

export function useCircuitHistory(circuitId: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ['circuit-history', circuitId, from, to],
    queryFn: () => fetchCircuitHistory(circuitId, from, to),
    enabled: !!circuitId,
    staleTime: 60 * 1000,
  });
}

export function useRunY1731Test() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runY1731Test,
    onSuccess: (data, circuitId) => {
      queryClient.invalidateQueries({ queryKey: ['circuit-history', circuitId] });
      queryClient.invalidateQueries({ queryKey: ['circuits'] });
    },
  });
}
