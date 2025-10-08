import { describe, it, expect } from 'vitest';
import { computeCostsForCircuit, calculateCompliancePercent, getMetricStatus } from './costEngine';
import type { VendorConfig } from '../types/vendor';
import type { CircuitRow } from '../types/circuit';

const mockVendor: VendorConfig = {
  vendorId: 'test',
  name: 'Test Vendor',
  currency: 'USD',
  kpiThresholds: {
    latency_ms: 100,
    jitter_ms: 5,
    frameLoss_pct: 0.5,
  },
  penaltyRules: {
    latency: {
      type: 'declarative',
      unitCost: 0.5,
      calc: 'over_threshold_ms * unitCost',
    },
    jitter: {
      type: 'declarative',
      unitCost: 20,
      calc: 'breach_count * unitCost',
    },
    frameLoss: {
      type: 'declarative',
      tiered: [
        { min: 0.5, max: 1.0, unitCost: 50 },
        { min: 1.0, max: 5.0, unitCost: 200 },
      ],
    },
  },
};

const mockCircuit: CircuitRow = {
  circuitId: 'TEST-001',
  vendorId: 'test',
  sites: ['Site A', 'Site B'],
  bandwidthMbps: 1000,
  status: 'active',
  latency_ms: 120,
  jitter_ms: 7,
  frameLoss_pct: 0.8,
  breachCount: 3,
  costUSD: 0,
  lastUpdated: new Date().toISOString(),
};

describe('costEngine', () => {
  describe('computeCostsForCircuit', () => {
    it('should calculate costs correctly for circuit with breaches', () => {
      const breachEvents = [
        { id: '1', circuitId: 'TEST-001', vendorId: 'test', metric: 'jitter' as const, threshold: 5, measuredValue: 7, costUSD: 20, timestamp: new Date().toISOString() },
        { id: '2', circuitId: 'TEST-001', vendorId: 'test', metric: 'jitter' as const, threshold: 5, measuredValue: 8, costUSD: 20, timestamp: new Date().toISOString() },
        { id: '3', circuitId: 'TEST-001', vendorId: 'test', metric: 'jitter' as const, threshold: 5, measuredValue: 6, costUSD: 20, timestamp: new Date().toISOString() },
      ];
      const result = computeCostsForCircuit(mockCircuit, mockVendor, breachEvents);

      expect(result.byMetric.latency).toBe(10);
      expect(result.byMetric.jitter).toBe(60);
      expect(result.byMetric.frameLoss).toBe(50);

      expect(result.total).toBe(120);
    });

    it('should ensure total equals sum of byMetric costs', () => {
      const result = computeCostsForCircuit(mockCircuit, mockVendor, []);

      const calculatedTotal =
        (result.byMetric.latency || 0) +
        (result.byMetric.jitter || 0) +
        (result.byMetric.frameLoss || 0);

      expect(result.total).toBe(calculatedTotal);
    });

    it('should return zero costs for compliant circuit', () => {
      const compliantCircuit: CircuitRow = {
        ...mockCircuit,
        latency_ms: 80,
        jitter_ms: 3,
        frameLoss_pct: 0.2,
      };

      const result = computeCostsForCircuit(compliantCircuit, mockVendor, []);

      expect(result.total).toBe(0);
      expect(result.byMetric.latency).toBe(0);
      expect(result.byMetric.jitter).toBe(0);
      expect(result.byMetric.frameLoss).toBe(0);
    });

    it('should handle tiered pricing correctly', () => {
      const highFrameLossCircuit: CircuitRow = {
        ...mockCircuit,
        latency_ms: 80,
        jitter_ms: 3,
        frameLoss_pct: 2.5,
      };

      const result = computeCostsForCircuit(highFrameLossCircuit, mockVendor, []);

      expect(result.byMetric.frameLoss).toBe(200);
    });
  });

  describe('calculateCompliancePercent', () => {
    it('should return 100% for all compliant circuits', () => {
      const compliantCircuits: CircuitRow[] = [
        { ...mockCircuit, latency_ms: 80, jitter_ms: 3, frameLoss_pct: 0.2 },
        { ...mockCircuit, latency_ms: 90, jitter_ms: 4, frameLoss_pct: 0.3 },
      ];

      const result = calculateCompliancePercent(compliantCircuits, mockVendor);
      expect(result).toBe(100);
    });

    it('should return 0% for all non-compliant circuits', () => {
      const nonCompliantCircuits: CircuitRow[] = [
        { ...mockCircuit, latency_ms: 120, jitter_ms: 7, frameLoss_pct: 0.8 },
        { ...mockCircuit, latency_ms: 150, jitter_ms: 8, frameLoss_pct: 1.2 },
      ];

      const result = calculateCompliancePercent(nonCompliantCircuits, mockVendor);
      expect(result).toBe(0);
    });

    it('should calculate correct percentage for mixed circuits', () => {
      const mixedCircuits: CircuitRow[] = [
        { ...mockCircuit, latency_ms: 80, jitter_ms: 3, frameLoss_pct: 0.2 },
        { ...mockCircuit, latency_ms: 120, jitter_ms: 7, frameLoss_pct: 0.8 },
      ];

      const result = calculateCompliancePercent(mixedCircuits, mockVendor);
      expect(result).toBe(50);
    });

    it('should return 100% for empty circuit list', () => {
      const result = calculateCompliancePercent([], mockVendor);
      expect(result).toBe(100);
    });
  });

  describe('getMetricStatus', () => {
    it('should return green for values below threshold', () => {
      expect(getMetricStatus(80, 100)).toBe('green');
    });

    it('should return amber for values near threshold', () => {
      expect(getMetricStatus(105, 100)).toBe('amber');
    });

    it('should return red for values significantly above threshold', () => {
      expect(getMetricStatus(120, 100)).toBe('red');
    });
  });
});
