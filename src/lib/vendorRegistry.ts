import type { VendorConfig } from '../types/vendor';

class VendorRegistry {
  private vendors: Map<string, VendorConfig> = new Map();

  register(config: VendorConfig): void {
    this.vendors.set(config.vendorId, config);
  }

  registerMultiple(configs: VendorConfig[]): void {
    configs.forEach(config => this.register(config));
  }

  get(vendorId: string): VendorConfig | undefined {
    return this.vendors.get(vendorId);
  }

  getAll(): VendorConfig[] {
    return Array.from(this.vendors.values())
      .filter(v => v.isActive !== false)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }

  exists(vendorId: string): boolean {
    return this.vendors.has(vendorId);
  }

  remove(vendorId: string): boolean {
    return this.vendors.delete(vendorId);
  }

  clear(): void {
    this.vendors.clear();
  }
}

export const vendorRegistry = new VendorRegistry();

export const defaultVendors: VendorConfig[] = [
  {
    vendorId: 'att',
    name: 'AT&T',
    currency: 'USD',
    displayOrder: 1,
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
    uiHints: {
      color: '#00A8E0',
    },
    isActive: true,
  },
  {
    vendorId: 'verizon',
    name: 'Verizon',
    currency: 'USD',
    displayOrder: 2,
    kpiThresholds: {
      latency_ms: 90,
      jitter_ms: 4,
      frameLoss_pct: 0.3,
    },
    penaltyRules: {
      latency: {
        type: 'declarative',
        unitCost: 0.75,
        calc: 'over_threshold_ms * unitCost',
      },
      jitter: {
        type: 'declarative',
        unitCost: 25,
        calc: 'breach_count * unitCost',
      },
      frameLoss: {
        type: 'declarative',
        tiered: [
          { min: 0.3, max: 0.8, unitCost: 60 },
          { min: 0.8, max: 3.0, unitCost: 250 },
        ],
      },
    },
    uiHints: {
      color: '#CD040B',
    },
    isActive: true,
  },
  {
    vendorId: 'tmobile',
    name: 'T-Mobile',
    currency: 'USD',
    displayOrder: 3,
    kpiThresholds: {
      latency_ms: 110,
      jitter_ms: 6,
      frameLoss_pct: 0.6,
    },
    penaltyRules: {
      latency: {
        type: 'declarative',
        unitCost: 0.4,
        calc: 'over_threshold_ms * unitCost',
      },
      jitter: {
        type: 'declarative',
        unitCost: 15,
        calc: 'breach_count * unitCost',
      },
      frameLoss: {
        type: 'declarative',
        tiered: [
          { min: 0.6, max: 1.2, unitCost: 45 },
          { min: 1.2, max: 6.0, unitCost: 180 },
        ],
      },
    },
    uiHints: {
      color: '#E20074',
    },
    isActive: true,
  },
];

vendorRegistry.registerMultiple(defaultVendors);
