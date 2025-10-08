export type VendorConfig = {
  vendorId: string;
  name: string;
  logoUrl?: string;
  currency: string;
  kpiThresholds: {
    latency_ms: number;
    jitter_ms: number;
    frameLoss_pct: number;
  };
  penaltyRules: Record<string, PenaltyRule>;
  uiHints?: {
    color?: string;
    accent?: string;
    badge?: string;
  };
  displayOrder?: number;
  isActive?: boolean;
};

export type PenaltyRule = {
  type: 'declarative' | 'functional';
  unitCost?: number;
  calc?: string;
  tiered?: Array<{
    min: number;
    max: number;
    unitCost: number;
  }>;
  pluginUrl?: string;
};

export type VendorKPIs = {
  vendorId: string;
  compliancePercent: number;
  totalBreaches: number;
  totalCostUSD: number;
  breachesByMetric: {
    latency: number;
    jitter: number;
    frameLoss: number;
  };
  costByMetric: {
    latency: number;
    jitter: number;
    frameLoss: number;
  };
};
