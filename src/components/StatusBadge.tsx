type StatusBadgeProps = {
  status: 'green' | 'amber' | 'red';
  label: string;
  size?: 'sm' | 'md';
};

const statusClasses = {
  green: 'bg-green-100 text-green-800 border-green-300',
  amber: 'bg-amber-100 text-amber-800 border-amber-300',
  red: 'bg-red-100 text-red-800 border-red-300',
};

export function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${statusClasses[status]} ${sizeClasses}`}
      role="status"
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  );
}
