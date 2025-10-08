import type { VendorConfig } from '../types/vendor';
import type { CircuitRow, CircuitFilters, BreachEvent, KPIDataPoint, Y1731TestResult } from '../types/circuit';
import { vendorRegistry } from './vendorRegistry';
import { mockCircuits, generateBreachEvents, generateKPIHistory, createMockY1731Test, completeMockY1731Test } from './mockData';

const simulatedDelay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchVendors(): Promise<VendorConfig[]> {
  await simulatedDelay();
  return vendorRegistry.getAll();
}

export async function fetchCircuits(
  vendorId?: string,
  filters?: CircuitFilters
): Promise<CircuitRow[]> {
  await simulatedDelay();

  let circuits = [...mockCircuits];

  if (vendorId) {
    circuits = circuits.filter(c => c.vendorId === vendorId);
  }

  if (filters?.region) {
    circuits = circuits.filter(c => c.region === filters.region);
  }

  if (filters?.status) {
    circuits = circuits.filter(c => c.status === filters.status);
  }

  if (filters?.bandwidthTier) {
    const bandwidth = parseInt(filters.bandwidthTier);
    circuits = circuits.filter(c => c.bandwidthMbps === bandwidth);
  }

  if (filters?.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    circuits = circuits.filter(
      c =>
        c.circuitId.toLowerCase().includes(term) ||
        c.sites.some(s => s.toLowerCase().includes(term))
    );
  }

  return circuits;
}

export async function fetchCircuitHistory(
  circuitId: string,
  from?: string,
  to?: string
): Promise<{ kpiHistory: KPIDataPoint[]; breachEvents: BreachEvent[] }> {
  await simulatedDelay();

  const circuit = mockCircuits.find(c => c.circuitId === circuitId);
  if (!circuit) {
    throw new Error('Circuit not found');
  }

  const kpiHistory = generateKPIHistory(circuit);
  const breachEvents = generateBreachEvents(circuit, 15);

  return { kpiHistory, breachEvents };
}

export async function runY1731Test(circuitId: string): Promise<Y1731TestResult> {
  await simulatedDelay(500);

  const test = createMockY1731Test(circuitId);

  await simulatedDelay(2000);

  return completeMockY1731Test(test);
}

export async function fetchBreachEvents(
  vendorId?: string,
  from?: string,
  to?: string
): Promise<BreachEvent[]> {
  await simulatedDelay();

  let circuits = mockCircuits;
  if (vendorId) {
    circuits = circuits.filter(c => c.vendorId === vendorId);
  }

  const allEvents: BreachEvent[] = [];
  circuits.forEach(circuit => {
    const events = generateBreachEvents(circuit, 5);
    allEvents.push(...events);
  });

  return allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
