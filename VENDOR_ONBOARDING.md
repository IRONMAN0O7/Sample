# Vendor Onboarding Guide

This guide explains how to add a new vendor to the SLA Performance Dashboard without modifying the application code.

## Overview

The dashboard uses a **config-driven vendor system** where each vendor is defined by a JSON configuration that includes:
- KPI thresholds (latency, jitter, frame loss)
- Penalty calculation rules
- UI customization hints
- Display preferences

## Quick Start

### 1. Create Vendor Configuration

Create a new vendor configuration object following this structure:

```typescript
const newVendor: VendorConfig = {
  vendorId: 'sprint',              // Unique identifier (lowercase, no spaces)
  name: 'Sprint',                  // Display name
  logoUrl: '/logos/sprint.svg',    // Optional: vendor logo
  currency: 'USD',                 // Currency for cost calculations
  displayOrder: 4,                 // Tab order (lower = left)
  isActive: true,                  // Whether to show in dashboard

  kpiThresholds: {
    latency_ms: 95,                // Maximum acceptable latency
    jitter_ms: 4.5,                // Maximum acceptable jitter
    frameLoss_pct: 0.4,            // Maximum acceptable frame loss
  },

  penaltyRules: {
    latency: {
      type: 'declarative',
      unitCost: 0.60,
      calc: 'over_threshold_ms * unitCost'
    },
    jitter: {
      type: 'declarative',
      unitCost: 25,
      calc: 'breach_count * unitCost'
    },
    frameLoss: {
      type: 'declarative',
      tiered: [
        { min: 0.4, max: 0.9, unitCost: 55 },
        { min: 0.9, max: 4.0, unitCost: 220 }
      ]
    }
  },

  uiHints: {
    color: '#FFD100'               // Brand color for UI elements
  }
};
```

### 2. Register the Vendor

Add the vendor to the registry in `src/lib/vendorRegistry.ts`:

```typescript
import { vendorRegistry } from './vendorRegistry';

vendorRegistry.register(newVendor);
```

Or register multiple vendors at once:

```typescript
vendorRegistry.registerMultiple([newVendor1, newVendor2]);
```

### 3. Provide Circuit Data

The dashboard expects circuit data for the new vendor. If using the mock data system, circuits will be automatically generated. For production:

- Add circuit records with matching `vendorId`
- Ensure KPI measurements are provided
- Include breach events for historical analysis

## Configuration Reference

### VendorConfig Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vendorId` | string | Yes | Unique identifier (used in URLs and data) |
| `name` | string | Yes | Display name shown in UI |
| `logoUrl` | string | No | Path or URL to vendor logo |
| `currency` | string | Yes | Currency code (USD, EUR, etc.) |
| `displayOrder` | number | No | Tab order (default: 0) |
| `isActive` | boolean | No | Show in dashboard (default: true) |
| `kpiThresholds` | object | Yes | SLA threshold values |
| `penaltyRules` | object | Yes | Cost calculation rules |
| `uiHints` | object | No | UI customization options |

### KPI Thresholds

Define the maximum acceptable values for each metric:

```typescript
kpiThresholds: {
  latency_ms: number,      // Milliseconds
  jitter_ms: number,       // Milliseconds
  frameLoss_pct: number    // Percentage (0-100)
}
```

### Penalty Rules

Two types of penalty rules are supported:

#### 1. Linear Calculation

Applies a simple formula for cost calculation:

```typescript
{
  type: 'declarative',
  unitCost: 0.5,
  calc: 'over_threshold_ms * unitCost'
}
```

**Available variables:**
- `over_threshold_ms` - Amount over threshold
- `breach_count` - Number of breach events
- `unitCost` - Cost multiplier

#### 2. Tiered Pricing

Applies different costs based on severity:

```typescript
{
  type: 'declarative',
  tiered: [
    { min: 0.5, max: 1.0, unitCost: 50 },   // Minor breach
    { min: 1.0, max: 5.0, unitCost: 200 }   // Major breach
  ]
}
```

The system finds the tier where the measured value falls and applies that cost.

## Cost Calculation Engine

### How Costs are Calculated

The cost engine (`src/lib/costEngine.ts`) processes each circuit:

1. **Check Thresholds**: Compare measured values against thresholds
2. **Apply Rules**: Use penalty rules to calculate per-metric costs
3. **Sum Total**: Add all metric costs for total circuit cost

### Example Calculation

Given:
- Circuit latency: 120ms (threshold: 100ms)
- Rule: `unitCost: 0.5`, `calc: 'over_threshold_ms * unitCost'`

Calculation:
```
over_threshold = 120 - 100 = 20ms
cost = 20 * 0.5 = $10.00
```

### Validation

The cost engine ensures:
- Total cost = Sum of all metric costs (no rounding errors)
- Costs are non-negative
- Missing metrics default to zero cost

## Testing Your Vendor

### Acceptance Checklist

Before deploying a new vendor configuration:

- [ ] Vendor appears in navigation tabs
- [ ] Vendor page loads without errors
- [ ] KPI cards show correct thresholds
- [ ] Circuit table displays vendor's circuits
- [ ] Cost calculations sum correctly
- [ ] Filters work (region, bandwidth, status)
- [ ] Circuit modal opens with details
- [ ] Charts render with vendor data
- [ ] Export functions work (CSV, PNG)
- [ ] URL persistence works for filters
- [ ] No console errors or warnings

### Unit Tests

Add tests for your vendor's cost rules:

```typescript
import { computeCostsForCircuit } from './costEngine';

const myVendor: VendorConfig = {
  // ... your config
};

const testCircuit: CircuitRow = {
  // ... test circuit data
};

const result = computeCostsForCircuit(testCircuit, myVendor, []);

expect(result.total).toBe(expectedCost);
expect(result.byMetric.latency).toBe(expectedLatencyCost);
```

## Advanced: Custom Cost Plugins

For complex cost calculations that can't be expressed declaratively, the system supports custom plugin functions:

```typescript
penaltyRules: {
  customMetric: {
    type: 'functional',
    pluginUrl: '/plugins/custom-calc.js'  // External calculation function
  }
}
```

**Note**: Functional plugins are loaded dynamically and must be deployed separately. Use declarative rules whenever possible for security and maintainability.

## Troubleshooting

### Vendor Not Appearing

- Check `isActive` is `true` or undefined
- Verify `vendorId` matches circuit data
- Check browser console for errors
- Ensure `vendorRegistry.register()` was called

### Cost Calculations Incorrect

- Verify threshold values are correct
- Check penalty rule syntax
- Test with unit tests
- Validate that `unitCost` values are reasonable

### UI Issues

- Verify `uiHints.color` is a valid hex color
- Check `displayOrder` for correct tab position
- Ensure `logoUrl` path is accessible

### No Data Showing

- Verify circuits exist with matching `vendorId`
- Check that KPI values are being populated
- Ensure breach events are recorded
- Validate data types match schema

## Production Deployment

### Checklist

1. **Configuration**
   - [ ] Vendor config validated
   - [ ] Costs calculated and verified
   - [ ] UI tested in all views

2. **Data**
   - [ ] Circuit data loaded
   - [ ] KPI history available
   - [ ] Breach events recorded

3. **Testing**
   - [ ] All acceptance criteria met
   - [ ] Unit tests passing
   - [ ] No console errors
   - [ ] Performance acceptable

4. **Documentation**
   - [ ] Internal docs updated
   - [ ] Team trained on new vendor
   - [ ] Runbook created

## Support

For questions or issues:
1. Review this documentation
2. Check the TypeScript types in `src/types/vendor.ts`
3. Examine existing vendor configurations in `src/lib/vendorRegistry.ts`
4. Review cost engine tests in `src/lib/costEngine.test.ts`

## Examples

### Example 1: Simple Vendor

```typescript
{
  vendorId: 'centurylink',
  name: 'CenturyLink',
  currency: 'USD',
  kpiThresholds: {
    latency_ms: 105,
    jitter_ms: 5.5,
    frameLoss_pct: 0.55
  },
  penaltyRules: {
    latency: {
      type: 'declarative',
      unitCost: 0.45,
      calc: 'over_threshold_ms * unitCost'
    },
    jitter: {
      type: 'declarative',
      unitCost: 18,
      calc: 'breach_count * unitCost'
    },
    frameLoss: {
      type: 'declarative',
      unitCost: 100,
      calc: 'breach_count * unitCost'
    }
  }
}
```

### Example 2: Complex Tiered Pricing

```typescript
{
  vendorId: 'premium-isp',
  name: 'Premium ISP',
  currency: 'USD',
  kpiThresholds: {
    latency_ms: 50,
    jitter_ms: 2,
    frameLoss_pct: 0.1
  },
  penaltyRules: {
    latency: {
      type: 'declarative',
      tiered: [
        { min: 50, max: 75, unitCost: 100 },
        { min: 75, max: 100, unitCost: 250 },
        { min: 100, max: 999, unitCost: 500 }
      ]
    },
    jitter: {
      type: 'declarative',
      tiered: [
        { min: 2, max: 5, unitCost: 75 },
        { min: 5, max: 10, unitCost: 200 }
      ]
    },
    frameLoss: {
      type: 'declarative',
      tiered: [
        { min: 0.1, max: 0.5, unitCost: 150 },
        { min: 0.5, max: 2.0, unitCost: 500 },
        { min: 2.0, max: 10.0, unitCost: 1000 }
      ]
    }
  },
  uiHints: {
    color: '#2563eb'
  }
}
```

## Summary

Adding a new vendor requires:
1. Create configuration JSON
2. Register with vendor registry
3. Ensure circuit data is available
4. Test thoroughly
5. Deploy

No code changes are needed to the core application. The dashboard dynamically adapts to vendor configurations, making vendor management straightforward and maintainable.
