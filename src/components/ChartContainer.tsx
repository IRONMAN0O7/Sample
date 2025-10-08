import { ReactNode } from 'react';
import { Camera } from 'lucide-react';
import html2canvas from 'html2canvas';

type ChartContainerProps = {
  title: string;
  children: ReactNode;
  onExport?: () => void;
};

export function ChartContainer({ title, children, onExport }: ChartContainerProps) {
  const chartId = `chart-${title.toLowerCase().replace(/\s+/g, '-')}`;

  const handleExportPNG = async () => {
    const element = document.getElementById(chartId);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.click();
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Failed to export chart:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg border-2 border-slate-200 p-6 shadow-sm" id={chartId}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <button
          onClick={onExport || handleExportPNG}
          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          aria-label={`Export ${title} as PNG`}
          title="Export as PNG"
        >
          <Camera size={18} />
        </button>
      </div>
      <div className="mt-2">
        {children}
      </div>
    </div>
  );
}
