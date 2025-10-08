export type CircuitStatus = 'active' | 'degraded' | 'down';

export type CircuitRow = {
  circuitId: string;
  vendorId: string;
  sites: string[];
  bandwidthMbps: number;
  status: CircuitStatus;
  region?: string;
  latency_ms: number;
  jitter_ms: number;
  frameLoss_pct: number;
  breachCount: number;
  costUSD: number;
  lastUpdated: string;
};

export type BreachEvent = {
  id: string;
  circuitId: string;
  vendorId: string;
  metric: 'latency' | 'jitter' | 'frameLoss';
  threshold: number;
  measuredValue: number;
  costUSD: number;
  timestamp: string;
};

export type KPIDataPoint = {
  timestamp: string;
  latency_ms: number;
  jitter_ms: number;
  frameLoss_pct: number;
};

export type CostBreakdown = {
  total: number;
  byMetric: {
    latency?: number;
    jitter?: number;
    frameLoss?: number;
    [k: string]: number | undefined;
  };
  events: Array<{
    timestamp: string;
    metric: string;
    value: number;
    cost: number;
  }>;
};

export type Y1731TestResult = {
  jobId: string;
  circuitId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results?: {
    latency_ms: number;
    jitter_ms: number;
    frameLoss_pct: number;
    timestamp: string;
  };
  startedAt: string;
  completedAt?: string;
};

export type CircuitFilters = {
  timeWindow?: string;
  region?: string;
  bandwidthTier?: string;
  status?: CircuitStatus;
  searchTerm?: string;
};
