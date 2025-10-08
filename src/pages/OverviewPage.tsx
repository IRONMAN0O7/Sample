import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, AlertTriangle, DollarSign, Activity } from 'lucide-react';
import { useVendors } from '../hooks/useVendors';
import { useCircuits } from '../hooks/useCircuits';
import { KPICard } from '../components/KPICard';
import { DataTable, Column } from '../components/DataTable';
import { ChartContainer } from '../components/ChartContainer';
import { CardSkeleton, TableSkeleton, ChartSkeleton } from '../components/LoadingSkeleton';
import { ExportButton, exportToCSV } from '../components/ExportButton';
import { vendorRegistry } from '../lib/vendorRegistry';
import { calculateCompliancePercent, computeCostsForCircuit } from '../lib/costEngine';
import { fetchBreachEvents } from '../lib/api';
import type { CircuitRow } from '../types/circuit';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function OverviewPage() {
  const { data: vendors, isLoading: vendorsLoading } = useVendors();
  const { data: allCircuits, isLoading: circuitsLoading } = useCircuits();

  const overviewStats = useMemo(() => {
    if (!allCircuits || !vendors) return null;

    const totalBreaches = allCircuits.reduce((sum, c) => sum + c.breachCount, 0);
    const totalCost = allCircuits.reduce((sum, c) => sum + c.costUSD, 0);

    let compliantCount = 0;
    allCircuits.forEach(circuit => {
      const vendor = vendorRegistry.get(circuit.vendorId);
      if (!vendor) return;

      const latencyOk = circuit.latency_ms <= vendor.kpiThresholds.latency_ms;
      const jitterOk = circuit.jitter_ms <= vendor.kpiThresholds.jitter_ms;
      const frameLossOk = circuit.frameLoss_pct <= vendor.kpiThresholds.frameLoss_pct;

      if (latencyOk && jitterOk && frameLossOk) {
        compliantCount++;
      }
    });

    const compliancePercent = Math.round((compliantCount / allCircuits.length) * 100);

    return {
      compliancePercent,
      totalBreaches,
      totalCost,
    };
  }, [allCircuits, vendors]);

  const vendorComparison = useMemo(() => {
    if (!allCircuits || !vendors) return [];

    return vendors.map(vendor => {
      const vendorCircuits = allCircuits.filter(c => c.vendorId === vendor.vendorId);
      const totalBreaches = vendorCircuits.reduce((sum, c) => sum + c.breachCount, 0);
      const totalCost = vendorCircuits.reduce((sum, c) => sum + c.costUSD, 0);
      const compliancePercent = calculateCompliancePercent(vendorCircuits, vendor);

      return {
        name: vendor.name,
        vendorId: vendor.vendorId,
        breaches: totalBreaches,
        cost: totalCost,
        compliance: compliancePercent,
        circuits: vendorCircuits.length,
      };
    });
  }, [allCircuits, vendors]);

  const topCostlyCircuits = useMemo(() => {
    if (!allCircuits) return [];
    return [...allCircuits]
      .sort((a, b) => b.costUSD - a.costUSD)
      .slice(0, 20);
  }, [allCircuits]);

  const trendData = useMemo(() => {
    const days = 30;
    const data = [];
    const now = Date.now();

    for (let i = days; i >= 0; i--) {
      const date = new Date(now - i * 24 * 3600000);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        latency: 85 + Math.random() * 30,
        jitter: 3 + Math.random() * 4,
        frameLoss: 0.2 + Math.random() * 0.8,
      });
    }

    return data;
  }, []);

  const circuitColumns: Column<CircuitRow>[] = [
    {
      key: 'circuitId',
      header: 'Circuit ID',
      accessor: (row) => row.circuitId,
      render: (row) => (
        <Link
          to={`/vendor/${row.vendorId}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          {row.circuitId}
        </Link>
      ),
    },
    {
      key: 'vendor',
      header: 'Vendor',
      accessor: (row) => {
        const vendor = vendorRegistry.get(row.vendorId);
        return vendor?.name || row.vendorId;
      },
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
      key: 'breaches',
      header: 'Breaches',
      accessor: (row) => row.breachCount,
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

  if (vendorsLoading || circuitsLoading) {
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Network Performance Overview</h1>
        <p className="text-slate-600">Monitor SLA compliance and cost impact across all vendors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Overall SLA Compliance"
          value={`${overviewStats?.compliancePercent}%`}
          icon={TrendingUp}
          color={overviewStats && overviewStats.compliancePercent >= 95 ? 'green' : overviewStats && overviewStats.compliancePercent >= 90 ? 'amber' : 'red'}
          subtitle="Across all vendors"
        />
        <KPICard
          title="Total Breaches"
          value={overviewStats?.totalBreaches.toLocaleString() || '0'}
          icon={AlertTriangle}
          color="red"
          subtitle="Last 30 days"
        />
        <KPICard
          title="Total Cost Impact"
          value={`$${overviewStats?.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0'}`}
          icon={DollarSign}
          color="red"
          subtitle="SLA penalties"
        />
        <KPICard
          title="Active Circuits"
          value={allCircuits?.length.toLocaleString() || '0'}
          icon={Activity}
          color="blue"
          subtitle="Being monitored"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="KPI Trends (30 Days)">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2} name="Latency (ms)" />
              <Line type="monotone" dataKey="jitter" stroke="#8b5cf6" strokeWidth={2} name="Jitter (ms)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Vendor Comparison">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vendorComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="breaches" fill="#ef4444" name="Breaches" />
              <Bar dataKey="cost" fill="#f59e0b" name="Cost ($)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Top 20 Costly Circuits</h2>
          <ExportButton
            onClick={() => exportToCSV(topCostlyCircuits, 'top-costly-circuits')}
            label="Export CSV"
          />
        </div>
        <DataTable
          data={topCostlyCircuits}
          columns={circuitColumns}
          emptyMessage="No circuits with cost impact found"
        />
      </div>
    </div>
  );
}
