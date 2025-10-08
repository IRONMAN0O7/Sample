export function CardSkeleton() {
  return (
    <div className="rounded-lg border-2 border-slate-200 bg-white p-6 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
      <div className="h-8 bg-slate-200 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-slate-200 rounded w-2/3"></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-lg border-2 border-slate-200 p-6 animate-pulse">
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded"></div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-lg border-2 border-slate-200 p-6 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
      <div className="h-64 bg-slate-100 rounded"></div>
    </div>
  );
}
