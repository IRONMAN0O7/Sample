import type { CircuitRow, BreachEvent, KPIDataPoint, Y1731TestResult } from '../types/circuit';
import { vendorRegistry } from './vendorRegistry';

const regions = ['US-East', 'US-West', 'EU-Central', 'APAC-Southeast'];
const sites = [
  ['New York', 'Boston'],
  ['San Francisco', 'Los Angeles'],
  ['Chicago', 'Dallas'],
  ['Frankfurt', 'Amsterdam'],
  ['Singapore', 'Tokyo'],
  ['London', 'Paris'],
  ['Seattle', 'Portland'],
  ['Miami', 'Atlanta'],
];

function generateCircuitId(vendor: string, index: number): string {
  return `${vendor.toUpperCase()}-CKT-${String(index).padStart(4, '0')}`;
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateKPIValue(threshold: number, breachProbability = 0.3): number {
  const isBreach = Math.random() < breachProbability;
  if (isBreach) {
    return threshold * randomInRange(1.1, 1.8);
  }
  return threshold * randomInRange(0.3, 0.95);
}

export function generateMockCircuits(): CircuitRow[] {
  const circuits: CircuitRow[] = [];
  const vendors = vendorRegistry.getAll();

  vendors.forEach((vendor, vendorIdx) => {
    const circuitCount = 25 + Math.floor(Math.random() * 10);

    for (let i = 0; i < circuitCount; i++) {
      const circuitId = generateCircuitId(vendor.vendorId, i + 1);
      const latency = parseFloat(
        generateKPIValue(vendor.kpiThresholds.latency_ms, 0.25).toFixed(2)
      );
      const jitter = parseFloat(
        generateKPIValue(vendor.kpiThresholds.jitter_ms, 0.2).toFixed(2)
      );
      const frameLoss = parseFloat(
        generateKPIValue(vendor.kpiThresholds.frameLoss_pct, 0.15).toFixed(4)
      );

      let breachCount = 0;
      if (latency > vendor.kpiThresholds.latency_ms) breachCount++;
      if (jitter > vendor.kpiThresholds.jitter_ms) breachCount++;
      if (frameLoss > vendor.kpiThresholds.frameLoss_pct) breachCount++;

      const bandwidths = [10, 100, 1000, 10000];
      const bandwidth = bandwidths[Math.floor(Math.random() * bandwidths.length)];

      let status: CircuitRow['status'] = 'active';
      if (breachCount >= 2) {
        status = 'degraded';
      } else if (breachCount >= 3 || Math.random() < 0.05) {
        status = 'down';
      }

      const costMultiplier = bandwidth / 1000;
      const baseCost = breachCount * randomInRange(50, 200) * costMultiplier;

      circuits.push({
        circuitId,
        vendorId: vendor.vendorId,
        sites: sites[Math.floor(Math.random() * sites.length)],
        bandwidthMbps: bandwidth,
        status,
        region: regions[Math.floor(Math.random() * regions.length)],
        latency_ms: latency,
        jitter_ms: jitter,
        frameLoss_pct: frameLoss,
        breachCount,
        costUSD: parseFloat(baseCost.toFixed(2)),
        lastUpdated: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      });
    }
  });

  return circuits;
}

export function generateBreachEvents(circuit: CircuitRow, count = 10): BreachEvent[] {
  const events: BreachEvent[] = [];
  const vendor = vendorRegistry.get(circuit.vendorId);
  if (!vendor) return events;

  for (let i = 0; i < count; i++) {
    const metrics: Array<'latency' | 'jitter' | 'frameLoss'> = [];
    if (circuit.latency_ms > vendor.kpiThresholds.latency_ms) metrics.push('latency');
    if (circuit.jitter_ms > vendor.kpiThresholds.jitter_ms) metrics.push('jitter');
    if (circuit.frameLoss_pct > vendor.kpiThresholds.frameLoss_pct) metrics.push('frameLoss');

    if (metrics.length === 0) continue;

    const metric = metrics[Math.floor(Math.random() * metrics.length)];
    const threshold = vendor.kpiThresholds[
      metric === 'latency' ? 'latency_ms' : metric === 'jitter' ? 'jitter_ms' : 'frameLoss_pct'
    ];
    const measuredValue = threshold * randomInRange(1.1, 1.5);

    events.push({
      id: `breach-${circuit.circuitId}-${i}`,
      circuitId: circuit.circuitId,
      vendorId: circuit.vendorId,
      metric,
      threshold,
      measuredValue: parseFloat(measuredValue.toFixed(metric === 'frameLoss' ? 4 : 2)),
      costUSD: parseFloat(randomInRange(20, 150).toFixed(2)),
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 3600000).toISOString(),
    });
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function generateKPIHistory(circuit: CircuitRow, days = 30): KPIDataPoint[] {
  const points: KPIDataPoint[] = [];
  const vendor = vendorRegistry.get(circuit.vendorId);
  if (!vendor) return points;

  const now = Date.now();
  const interval = (days * 24 * 3600000) / 100;

  for (let i = 0; i < 100; i++) {
    const timestamp = new Date(now - (100 - i) * interval).toISOString();
    points.push({
      timestamp,
      latency_ms: parseFloat(
        generateKPIValue(vendor.kpiThresholds.latency_ms, 0.2).toFixed(2)
      ),
      jitter_ms: parseFloat(
        generateKPIValue(vendor.kpiThresholds.jitter_ms, 0.15).toFixed(2)
      ),
      frameLoss_pct: parseFloat(
        generateKPIValue(vendor.kpiThresholds.frameLoss_pct, 0.1).toFixed(4)
      ),
    });
  }

  return points;
}

export function createMockY1731Test(circuitId: string): Y1731TestResult {
  const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  return {
    jobId,
    circuitId,
    status: 'pending',
    startedAt: new Date().toISOString(),
  };
}

export function completeMockY1731Test(test: Y1731TestResult): Y1731TestResult {
  return {
    ...test,
    status: 'completed',
    results: {
      latency_ms: parseFloat(randomInRange(50, 150).toFixed(2)),
      jitter_ms: parseFloat(randomInRange(2, 8).toFixed(2)),
      frameLoss_pct: parseFloat(randomInRange(0.1, 1.5).toFixed(4)),
      timestamp: new Date().toISOString(),
    },
    completedAt: new Date().toISOString(),
  };
}

const mockCircuits = generateMockCircuits();

export { mockCircuits };
