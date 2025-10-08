import { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export type Column<T> = {
  key: string;
  header: string;
  accessor: (row: T) => string | number;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
};

type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  rowClassName?: (row: T) => string;
};

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

export function DataTable<T>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'No data available',
  rowClassName
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';

    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;

    const column = columns.find(col => col.key === sortConfig.key);
    if (!column) return 0;

    const aValue = column.accessor(a);
    const bValue = column.accessor(b);

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 bg-white rounded-lg border-2 border-slate-200">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg border-2 border-slate-200 shadow-sm">
      <table className="w-full">
        <thead className="bg-slate-50 border-b-2 border-slate-200">
          <tr>
            {columns.map(column => (
              <th
                key={column.key}
                className={`px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer hover:bg-slate-100' : ''
                } ${column.width || ''}`}
                onClick={() => column.sortable !== false && handleSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  <span>{column.header}</span>
                  {column.sortable !== false && (
                    <span className="text-slate-400">
                      {sortConfig?.key === column.key ? (
                        sortConfig.direction === 'asc' ? (
                          <ArrowUp size={14} />
                        ) : (
                          <ArrowDown size={14} />
                        )
                      ) : (
                        <ArrowUpDown size={14} />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {sortedData.map((row, idx) => (
            <tr
              key={idx}
              className={`
                ${onRowClick ? 'cursor-pointer hover:bg-blue-50' : ''}
                transition-colors
                ${rowClassName ? rowClassName(row) : ''}
              `}
              onClick={() => onRowClick?.(row)}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onRowClick(row);
                }
              }}
            >
              {columns.map(column => (
                <td key={column.key} className="px-6 py-4 text-sm text-slate-900">
                  {column.render ? column.render(row) : column.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
