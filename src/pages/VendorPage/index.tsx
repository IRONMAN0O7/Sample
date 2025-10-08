import { useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { useCircuits } from '../../hooks/useCircuits';
import { vendorRegistry } from '../../lib/vendorRegistry';
import { calculateCompliancePercent, getMetricStatus } from '../../lib/costEngine';
import { KPICard } from '../../components/KPICard';
import { DataTable, Column } from '../../components/DataTable';
import { ChartContainer } from '../../components/ChartContainer';
import { CardSkeleton, TableSkeleton, ChartSkeleton } from '../../components/LoadingSkeleton';
import { ExportButton, exportToCSV } from '../../components/ExportButton';
import { StatusBadge } from '../../components/StatusBadge';
import { VendorFilters } from './VendorFilters';
import { CircuitModal } from './CircuitModal';
import type { CircuitRow, CircuitFilters } from '../../types/circuit';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function VendorPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCircuit, setSelectedCircuit] = useState<CircuitRow | null>(null);

  const filters: CircuitFilters = useMemo(() => ({
    timeWindow: searchParams.get('timeWindow') || undefined,
    region: searchParams.get('region') || undefined,
    bandwidthTier: searchParams.get('bandwidthTier') || undefined,
    status: searchParams.get('status') as CircuitFilters['status'] || undefined,
  }), [searchParams]);

  const { data: circuits, isLoading } = useCircuits(vendorId, filters);
  const vendor = vendorId ? vendorRegistry.get(vendorId) : null;

  const handleFiltersChange = (newFilters: CircuitFilters) => {
    const params = new URLSearchParams();
    if (newFilters.timeWindow) params.set('timeWindow', newFilters.timeWindow);
    if (newFilters.region) params.set('region', newFilters.region);
    if (newFilters.bandwidthTier) params.set('bandwidthTier', newFilters.bandwidthTier);
    if (newFilters.status) params.set('status', newFilters.status);
    setSearchParams(params);
  };

  const vendorStats = useMemo(() => {
    if (!circuits || !vendor) return null;

    const compliancePercent = calculateCompliancePercent(circuits, vendor);
    const totalBreaches = circuits.reduce((sum, c) => sum + c.breachCount, 0);
    const totalCost = circuits.reduce((sum, c) => sum + c.costUSD, 0);

    const breachesByMetric = {
      latency: 0,
      jitter: 0,
      frameLoss: 0,
    };

    const costByMetric = {
      latency: 0,
      jitter: 0,
      frameLoss: 0,
    };

    circuits.forEach(circuit => {
      if (circuit.latency_ms > vendor.kpiThresholds.latency_ms) {
        breachesByMetric.latency++;
        costByMetric.latency += circuit.costUSD * 0.4;
      }
      if (circuit.jitter_ms > vendor.kpiThresholds.jitter_ms) {
        breachesByMetric.jitter++;
        costByMetric.jitter += circuit.costUSD * 0.3;
      }
      if (circuit.frameLoss_pct > vendor.kpiThresholds.frameLoss_pct) {
        breachesByMetric.frameLoss++;
        costByMetric.frameLoss += circuit.costUSD * 0.3;
      }
    });

    return {
      compliancePercent,
      totalBreaches,
      totalCost,
      breachesByMetric,
      costByMetric,
    };
  }, [circuits, vendor]);

  const availableRegions = useMemo(() => {
    if (!circuits) return [];
    return Array.from(new Set(circuits.map(c => c.region).filter(Boolean))) as string[];
  }, [circuits]);

  const availableBandwidths = useMemo(() => {
    if (!circuits) return [];
    return Array.from(new Set(circuits.map(c => c.bandwidthMbps))).sort((a, b) => a - b);
  }, [circuits]);

  const breachesChartData = useMemo(() => {
    if (!vendorStats) return [];
    return [
      { metric: 'Latency', count: vendorStats.breachesByMetric.latency, cost: vendorStats.costByMetric.latency },
      { metric: 'Jitter', count: vendorStats.breachesByMetric.jitter, cost: vendorStats.costByMetric.jitter },
      { metric: 'Frame Loss', count: vendorStats.breachesByMetric.frameLoss, cost: vendorStats.costByMetric.frameLoss },
    ];
  }, [vendorStats]);

  const costByCircuitData = useMemo(() => {
    if (!circuits) return [];
    return circuits
      .filter(c => c.costUSD > 0)
      .sort((a, b) => b.costUSD - a.costUSD)
      .slice(0, 10)
      .map(c => ({
        name: c.circuitId.substring(0, 15),
        cost: c.costUSD,
      }));
  }, [circuits]);

  const circuitColumns: Column<CircuitRow>[] = [
    {
      key: 'circuitId',
      header: 'Circuit ID',
      accessor: (row) => row.circuitId,
      render: (row) => <span className="font-medium text-slate-900">{row.circuitId}</span>,
    },
    {
      key: 'sites',
      header: 'Sites',
      accessor: (row) => row.sites.join(' - '),
    },
    {
      key: 'bandwidth',
      header: 'Bandwidth',
      accessor: (row) => row.bandwidthMbps,
      render: (row) => `${row.bandwidthMbps} Mbps`,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => row.status,
      render: (row) => (
        <StatusBadge
          status={row.status === 'active' ? 'green' : row.status === 'degraded' ? 'amber' : 'red'}
          label={row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          size="sm"
        />
      ),
    },
    {
      key: 'latency',
      header: 'Latency',
      accessor: (row) => row.latency_ms,
      render: (row) => {
        const status = vendor ? getMetricStatus(row.latency_ms, vendor.kpiThresholds.latency_ms) : 'green';
        return (
          <span className={status === 'red' ? 'text-red-600 font-semibold' : status === 'amber' ? 'text-amber-600' : 'text-slate-900'}>
            {row.latency_ms} ms
          </span>
        );
      },
    },
    {
      key: 'jitter',
      header: 'Jitter',
      accessor: (row) => row.jitter_ms,
      render: (row) => {
        const status = vendor ? getMetricStatus(row.jitter_ms, vendor.kpiThresholds.jitter_ms) : 'green';
        return (
          <span className={status === 'red' ? 'text-red-600 font-semibold' : status === 'amber' ? 'text-amber-600' : 'text-slate-900'}>
            {row.jitter_ms} ms
          </span>
        );
      },
    },
    {
      key: 'frameLoss',
      header: 'Frame Loss',
      accessor: (row) => row.frameLoss_pct,
      render: (row) => {
        const status = vendor ? getMetricStatus(row.frameLoss_pct, vendor.kpiThresholds.frameLoss_pct) : 'green';
        return (
          <span className={status === 'red' ? 'text-red-600 font-semibold' : status === 'amber' ? 'text-amber-600' : 'text-slate-900'}>
            {row.frameLoss_pct}%
          </span>
        );
      },
    },
    {
      key: 'breaches',
      header: 'Breaches',
      accessor: (row) => row.breachCount,
      render: (row) => (
        <span className={row.breachCount > 0 ? 'text-red-600 font-semibold' : 'text-slate-900'}>
          {row.breachCount}
        </span>
      ),
    },
    {
      key: 'cost',
      header: 'Cost Impact',
      accessor: (row) => row.costUSD,
      render: (row) => (
        <span className="font-semibold text-red-600">
          ${row.costUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-slate-600">Vendor not found</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <ChartSkeleton />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{vendor.name} Dashboard</h1>
        <p className="text-slate-600">Monitor SLA compliance and cost impact for {vendor.name} circuits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="SLA Compliance"
          value={`${vendorStats?.compliancePercent}%`}
          icon={TrendingUp}
          color={vendorStats && vendorStats.compliancePercent >= 95 ? 'green' : vendorStats && vendorStats.compliancePercent >= 90 ? 'amber' : 'red'}
        />
        <KPICard
          title="Total Breaches"
          value={vendorStats?.totalBreaches.toLocaleString() || '0'}
          icon={AlertTriangle}
          color="red"
          subtitle={`L: ${vendorStats?.breachesByMetric.latency} • J: ${vendorStats?.breachesByMetric.jitter} • F: ${vendorStats?.breachesByMetric.frameLoss}`}
        />
        <KPICard
          title="Total Cost Impact"
          value={`$${vendorStats?.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0'}`}
          icon={DollarSign}
          color="red"
        />
        <KPICard
          title="Active Circuits"
          value={circuits?.length.toLocaleString() || '0'}
          color="blue"
        />
      </div>

      <VendorFilters
        filters={filters}
        onChange={handleFiltersChange}
        regions={availableRegions}
        bandwidthTiers={availableBandwidths}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Breaches by Metric">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={breachesChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="metric" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="count" fill="#ef4444" name="Breach Count" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Top 10 Costly Circuits">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costByCircuitData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis type="category" dataKey="name" stroke="#64748b" style={{ fontSize: '10px' }} width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="cost" fill="#f59e0b" name="Cost ($)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Circuits</h2>
          <ExportButton
            onClick={() => circuits && exportToCSV(circuits, `${vendor.vendorId}-circuits`)}
            label="Export CSV"
          />
        </div>
        <DataTable
          data={circuits || []}
          columns={circuitColumns}
          onRowClick={setSelectedCircuit}
          emptyMessage="No circuits found"
        />
      </div>

      {selectedCircuit && (
        <CircuitModal
          circuit={selectedCircuit}
          isOpen={!!selectedCircuit}
          onClose={() => setSelectedCircuit(null)}
        />
      )}
    </div>
  );
}
