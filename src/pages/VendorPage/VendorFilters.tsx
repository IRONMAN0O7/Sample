import { Filter } from 'lucide-react';
import type { CircuitFilters } from '../../types/circuit';

type VendorFiltersProps = {
  filters: CircuitFilters;
  onChange: (filters: CircuitFilters) => void;
  regions: string[];
  bandwidthTiers: number[];
};

export function VendorFilters({ filters, onChange, regions, bandwidthTiers }: VendorFiltersProps) {
  const handleFilterChange = (key: keyof CircuitFilters, value: string) => {
    onChange({
      ...filters,
      [key]: value === 'all' ? undefined : value,
    });
  };

  return (
    <div className="bg-white rounded-lg border-2 border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter size={20} className="text-slate-600" />
        <h3 className="font-semibold text-slate-900">Filters</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="time-window" className="block text-sm font-medium text-slate-700 mb-1">
            Time Window
          </label>
          <select
            id="time-window"
            value={filters.timeWindow || '30d'}
            onChange={(e) => handleFilterChange('timeWindow', e.target.value)}
            className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>

        <div>
          <label htmlFor="region" className="block text-sm font-medium text-slate-700 mb-1">
            Region
          </label>
          <select
            id="region"
            value={filters.region || 'all'}
            onChange={(e) => handleFilterChange('region', e.target.value)}
            className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Regions</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="bandwidth" className="block text-sm font-medium text-slate-700 mb-1">
            Bandwidth
          </label>
          <select
            id="bandwidth"
            value={filters.bandwidthTier || 'all'}
            onChange={(e) => handleFilterChange('bandwidthTier', e.target.value)}
            className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Tiers</option>
            {bandwidthTiers.map((bw) => (
              <option key={bw} value={bw.toString()}>
                {bw} Mbps
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={filters.status || 'all'}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="degraded">Degraded</option>
            <option value="down">Down</option>
          </select>
        </div>
      </div>
    </div>
  );
}
