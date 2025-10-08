import { X, PlayCircle, Loader2 } from 'lucide-react';
import { useCircuitHistory, useRunY1731Test } from '../../hooks/useCircuits';
import { vendorRegistry } from '../../lib/vendorRegistry';
import { getMetricStatus } from '../../lib/costEngine';
import { StatusBadge } from '../../components/StatusBadge';
import { ChartContainer } from '../../components/ChartContainer';
import type { CircuitRow } from '../../types/circuit';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type CircuitModalProps = {
  circuit: CircuitRow;
  isOpen: boolean;
  onClose: () => void;
};

export function CircuitModal({ circuit, isOpen, onClose }: CircuitModalProps) {
  const { data: history, isLoading } = useCircuitHistory(circuit.circuitId);
  const runTest = useRunY1731Test();
  const vendor = vendorRegistry.get(circuit.vendorId);

  if (!isOpen) return null;

  const handleRunTest = async () => {
    try {
      await runTest.mutateAsync(circuit.circuitId);
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  const latencyStatus = vendor ? getMetricStatus(circuit.latency_ms, vendor.kpiThresholds.latency_ms) : 'green';
  const jitterStatus = vendor ? getMetricStatus(circuit.jitter_ms, vendor.kpiThresholds.jitter_ms) : 'green';
  const frameLossStatus = vendor ? getMetricStatus(circuit.frameLoss_pct, vendor.kpiThresholds.frameLoss_pct) : 'green';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="circuit-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b-2 border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 id="circuit-modal-title" className="text-2xl font-bold text-slate-900">
              {circuit.circuitId}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {circuit.sites.join(' ↔ ')} • {circuit.bandwidthMbps} Mbps
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 border-2 border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Latency</span>
                <StatusBadge
                  status={latencyStatus}
                  label={latencyStatus === 'green' ? 'OK' : latencyStatus === 'amber' ? 'Warning' : 'Breach'}
                  size="sm"
                />
              </div>
              <p className="text-2xl font-bold text-slate-900">{circuit.latency_ms} ms</p>
              {vendor && (
                <p className="text-xs text-slate-500 mt-1">
                  Threshold: {vendor.kpiThresholds.latency_ms} ms
                </p>
              )}
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border-2 border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Jitter</span>
                <StatusBadge
                  status={jitterStatus}
                  label={jitterStatus === 'green' ? 'OK' : jitterStatus === 'amber' ? 'Warning' : 'Breach'}
                  size="sm"
                />
              </div>
              <p className="text-2xl font-bold text-slate-900">{circuit.jitter_ms} ms</p>
              {vendor && (
                <p className="text-xs text-slate-500 mt-1">
                  Threshold: {vendor.kpiThresholds.jitter_ms} ms
                </p>
              )}
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border-2 border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Frame Loss</span>
                <StatusBadge
                  status={frameLossStatus}
                  label={frameLossStatus === 'green' ? 'OK' : frameLossStatus === 'amber' ? 'Warning' : 'Breach'}
                  size="sm"
                />
              </div>
              <p className="text-2xl font-bold text-slate-900">{circuit.frameLoss_pct}%</p>
              {vendor && (
                <p className="text-xs text-slate-500 mt-1">
                  Threshold: {vendor.kpiThresholds.frameLoss_pct}%
                </p>
              )}
            </div>
          </div>

          {!isLoading && history?.kpiHistory && (
            <ChartContainer title="KPI History (Last 30 Days)">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={history.kpiHistory.slice(-50)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    stroke="#64748b"
                    style={{ fontSize: '11px' }}
                  />
                  <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="latency_ms" stroke="#3b82f6" strokeWidth={2} name="Latency (ms)" />
                  <Line type="monotone" dataKey="jitter_ms" stroke="#8b5cf6" strokeWidth={2} name="Jitter (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}

          {!isLoading && history?.breachEvents && history.breachEvents.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Recent Breach Events</h3>
              <div className="bg-slate-50 rounded-lg border-2 border-slate-200 max-h-64 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Timestamp</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Metric</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Value</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Threshold</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {history.breachEvents.slice(0, 10).map((event) => (
                      <tr key={event.id}>
                        <td className="px-4 py-2 text-xs text-slate-900">
                          {new Date(event.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-xs font-medium text-slate-900 capitalize">
                          {event.metric}
                        </td>
                        <td className="px-4 py-2 text-xs text-red-600 font-semibold">
                          {event.measuredValue}
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-600">
                          {event.threshold}
                        </td>
                        <td className="px-4 py-2 text-xs text-red-600 font-semibold">
                          ${event.costUSD.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="border-t-2 border-slate-200 pt-4">
            <button
              onClick={handleRunTest}
              disabled={runTest.isPending}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {runTest.isPending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <PlayCircle size={20} />
                  Run On-Demand Y.1731 Test
                </>
              )}
            </button>
            {runTest.isSuccess && (
              <p className="text-sm text-green-600 mt-2 font-medium">Test completed successfully!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
