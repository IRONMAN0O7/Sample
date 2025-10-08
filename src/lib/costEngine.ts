import type { VendorConfig, PenaltyRule } from '../types/vendor';
import type { CircuitRow, BreachEvent, CostBreakdown } from '../types/circuit';

function evaluateDeclarativeRule(
  rule: PenaltyRule,
  metric: 'latency' | 'jitter' | 'frameLoss',
  measuredValue: number,
  threshold: number,
  breachCount: number
): number {
  if (rule.tiered) {
    for (const tier of rule.tiered) {
      if (measuredValue >= tier.min && measuredValue < tier.max) {
        return tier.unitCost;
      }
    }
    const lastTier = rule.tiered[rule.tiered.length - 1];
    if (measuredValue >= lastTier.max) {
      return lastTier.unitCost;
    }
    return 0;
  }

  if (rule.calc && rule.unitCost !== undefined) {
    const overThreshold = Math.max(0, measuredValue - threshold);

    if (rule.calc.includes('over_threshold_ms')) {
      return overThreshold * rule.unitCost;
    }

    if (rule.calc.includes('breach_count')) {
      return breachCount * rule.unitCost;
    }
  }

  return 0;
}

export function computeCostsForCircuit(
  circuit: CircuitRow,
  vendor: VendorConfig,
  events: BreachEvent[]
): CostBreakdown {
  const byMetric: CostBreakdown['byMetric'] = {
    latency: 0,
    jitter: 0,
    frameLoss: 0,
  };

  const costEvents: CostBreakdown['events'] = [];

  const latencyBreaches = events.filter(e => e.metric === 'latency').length;
  const jitterBreaches = events.filter(e => e.metric === 'jitter').length;
  const frameLossBreaches = events.filter(e => e.metric === 'frameLoss').length;

  if (circuit.latency_ms > vendor.kpiThresholds.latency_ms && vendor.penaltyRules.latency) {
    const cost = evaluateDeclarativeRule(
      vendor.penaltyRules.latency,
      'latency',
      circuit.latency_ms,
      vendor.kpiThresholds.latency_ms,
      latencyBreaches
    );
    byMetric.latency = cost;
    if (cost > 0) {
      costEvents.push({
        timestamp: circuit.lastUpdated,
        metric: 'latency',
        value: circuit.latency_ms,
        cost,
      });
    }
  }

  if (circuit.jitter_ms > vendor.kpiThresholds.jitter_ms && vendor.penaltyRules.jitter) {
    const cost = evaluateDeclarativeRule(
      vendor.penaltyRules.jitter,
      'jitter',
      circuit.jitter_ms,
      vendor.kpiThresholds.jitter_ms,
      jitterBreaches
    );
    byMetric.jitter = cost;
    if (cost > 0) {
      costEvents.push({
        timestamp: circuit.lastUpdated,
        metric: 'jitter',
        value: circuit.jitter_ms,
        cost,
      });
    }
  }

  if (circuit.frameLoss_pct > vendor.kpiThresholds.frameLoss_pct && vendor.penaltyRules.frameLoss) {
    const cost = evaluateDeclarativeRule(
      vendor.penaltyRules.frameLoss,
      'frameLoss',
      circuit.frameLoss_pct,
      vendor.kpiThresholds.frameLoss_pct,
      frameLossBreaches
    );
    byMetric.frameLoss = cost;
    if (cost > 0) {
      costEvents.push({
        timestamp: circuit.lastUpdated,
        metric: 'frameLoss',
        value: circuit.frameLoss_pct,
        cost,
      });
    }
  }

  const total = (byMetric.latency || 0) + (byMetric.jitter || 0) + (byMetric.frameLoss || 0);

  return {
    total,
    byMetric,
    events: costEvents,
  };
}

export function getMetricStatus(
  value: number,
  threshold: number,
  nearThresholdMargin = 0.1
): 'green' | 'amber' | 'red' {
  if (value < threshold) {
    return 'green';
  }
  if (value < threshold * (1 + nearThresholdMargin)) {
    return 'amber';
  }
  return 'red';
}

export function calculateCompliancePercent(
  circuits: CircuitRow[],
  vendor: VendorConfig
): number {
  if (circuits.length === 0) return 100;

  const compliantCircuits = circuits.filter(circuit => {
    const latencyOk = circuit.latency_ms <= vendor.kpiThresholds.latency_ms;
    const jitterOk = circuit.jitter_ms <= vendor.kpiThresholds.jitter_ms;
    const frameLossOk = circuit.frameLoss_pct <= vendor.kpiThresholds.frameLoss_pct;
    return latencyOk && jitterOk && frameLossOk;
  });

  return Math.round((compliantCircuits.length / circuits.length) * 100);
}
