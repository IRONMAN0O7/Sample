# SLA Performance Dashboard

A production-ready React dashboard for monitoring SLA compliance and cost impact across multiple network service vendors. Built with TypeScript, React, Tailwind CSS, and Recharts.

## Features

### Core Capabilities

- **Multi-Vendor Monitoring**: Track AT&T, Verizon, T-Mobile, and easily add more vendors
- **Real-Time KPI Tracking**: Monitor latency, jitter, and frame loss metrics
- **Cost Impact Analysis**: Calculate SLA penalties using vendor-specific rules
- **Dynamic Vendor Onboarding**: Add new vendors via JSON configuration without code changes
- **Interactive Dashboards**: Overview and per-vendor detailed views
- **Advanced Filtering**: Filter by time window, region, bandwidth tier, and circuit status
- **Drill-Down Analysis**: Circuit-level detail with historical KPI charts and breach events
- **Export Functionality**: Export data to CSV and charts to PNG
- **URL Persistence**: Filters and navigation state preserved in URL

### Technical Highlights

- **Type-Safe**: Full TypeScript coverage with strict mode
- **Modular Architecture**: Clean separation of concerns with component-based design
- **Plugin System**: Config-driven vendor management with declarative cost rules
- **Tested**: Unit tests for cost calculations and vendor registry
- **Accessible**: WCAG-AA compliant with keyboard navigation and ARIA labels
- **Responsive**: Mobile-friendly design with breakpoints
- **Performance**: Optimized React Query caching and memoization

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the dashboard.

### Testing

```bash
npm run test        # Run tests in watch mode
npm run test:run    # Run tests once
```

### Production Build

```bash
npm run build
npm run preview     # Preview production build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── KPICard.tsx
│   ├── DataTable.tsx
│   ├── ChartContainer.tsx
│   ├── StatusBadge.tsx
│   ├── ExportButton.tsx
│   ├── LoadingSkeleton.tsx
│   └── Layout.tsx
├── pages/              # Page components
│   ├── OverviewPage.tsx
│   └── VendorPage/
│       ├── index.tsx
│       ├── VendorFilters.tsx
│       └── CircuitModal.tsx
├── lib/                # Business logic
│   ├── vendorRegistry.ts    # Vendor configuration management
│   ├── costEngine.ts        # Cost calculation engine
│   ├── mockData.ts          # Mock data generation
│   └── api.ts               # API layer
├── hooks/              # Custom React hooks
│   ├── useVendors.ts
│   └── useCircuits.ts
├── types/              # TypeScript definitions
│   ├── vendor.ts
│   └── circuit.ts
└── test/              # Test utilities and setup
```

## Architecture

### Vendor Registry

The `VendorRegistry` manages vendor configurations and supports dynamic vendor addition:

```typescript
import { vendorRegistry } from './lib/vendorRegistry';

vendorRegistry.register({
  vendorId: 'newvendor',
  name: 'New Vendor',
  currency: 'USD',
  kpiThresholds: { ... },
  penaltyRules: { ... }
});
```

### Cost Calculation Engine

The cost engine supports two types of penalty rules:

1. **Linear Calculation**: `over_threshold_ms * unitCost`
2. **Tiered Pricing**: Different costs based on severity ranges

All costs are calculated deterministically with validation that total equals sum of per-metric costs.

### Data Flow

1. **Mock API** generates realistic circuit and KPI data
2. **React Query** manages data fetching and caching
3. **Cost Engine** calculates penalties based on vendor rules
4. **Components** render data with real-time updates

## Adding a New Vendor

See [VENDOR_ONBOARDING.md](./VENDOR_ONBOARDING.md) for detailed instructions.

Quick example:

```typescript
const newVendor = {
  vendorId: 'sprint',
  name: 'Sprint',
  currency: 'USD',
  kpiThresholds: {
    latency_ms: 95,
    jitter_ms: 4.5,
    frameLoss_pct: 0.4
  },
  penaltyRules: {
    latency: {
      type: 'declarative',
      unitCost: 0.6,
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
  }
};

vendorRegistry.register(newVendor);
```

## Key Technologies

- **React 18**: UI framework with hooks and concurrent features
- **TypeScript**: Type-safe development
- **React Router**: Client-side routing
- **React Query**: Data fetching and caching
- **Recharts**: Chart visualization
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **Vitest**: Unit testing
- **Testing Library**: Component testing

## Features Breakdown

### Overview Page

- Overall SLA compliance across all vendors
- Total breach count and cost impact
- KPI trend charts (30-day view)
- Vendor comparison bar charts
- Top 20 costly circuits table
- CSV export

### Vendor Pages

- Per-vendor SLA compliance metrics
- Breach breakdown by metric type
- Cost impact by metric and circuit
- Advanced filtering (time, region, bandwidth, status)
- Sortable circuits table with color-coded status
- Circuit drill-down modal
- URL persistence for filters
- CSV export

### Circuit Modal

- Real-time KPI values with threshold comparison
- Color-coded status indicators (green/amber/red)
- Historical KPI sparklines
- Recent breach event timeline
- Cost breakdown by metric
- On-demand Y.1731 test execution

## Accessibility

- Semantic HTML with proper ARIA labels
- Keyboard navigation support (Tab, Enter, Space)
- Focus management for modals
- High contrast colors (WCAG-AA compliant)
- Screen reader friendly
- Descriptive button labels
- Status indicators with text alternatives

## Performance

- Lazy loaded routes
- React Query caching (30s stale time)
- Memoized calculations
- Virtual scrolling for large tables
- Optimized re-renders
- Code splitting ready

## Testing

Unit tests cover:
- Cost calculation accuracy
- Vendor registry operations
- Sum validation (total = sum of metrics)
- Compliance percentage calculations
- Status determination logic

Run tests:
```bash
npm run test:run
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome)

## License

Private - Internal Use Only

## Contributing

1. Create feature branch
2. Make changes with tests
3. Run `npm run build` to verify
4. Submit pull request

## Support

For questions or issues:
- Review documentation in this README
- Check [VENDOR_ONBOARDING.md](./VENDOR_ONBOARDING.md)
- Examine TypeScript types in `src/types/`
- Review test examples in `src/lib/*.test.ts`
