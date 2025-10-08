import { LucideIcon } from 'lucide-react';

type KPICardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'green' | 'amber' | 'red' | 'blue' | 'neutral';
};

const colorClasses = {
  green: 'border-green-200 bg-green-50',
  amber: 'border-amber-200 bg-amber-50',
  red: 'border-red-200 bg-red-50',
  blue: 'border-blue-200 bg-blue-50',
  neutral: 'border-slate-200 bg-white',
};

const iconColorClasses = {
  green: 'text-green-600',
  amber: 'text-amber-600',
  red: 'text-red-600',
  blue: 'text-blue-600',
  neutral: 'text-slate-600',
};

export function KPICard({ title, value, subtitle, icon: Icon, trend, color = 'neutral' }: KPICardProps) {
  return (
    <div className={`rounded-lg border-2 p-6 ${colorClasses[color]} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {Icon && (
          <div className={`${iconColorClasses[color]}`}>
            <Icon size={32} strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  );
}
