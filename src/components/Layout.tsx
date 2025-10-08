import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useVendors } from '../hooks/useVendors';

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { data: vendors } = useVendors();

  const tabs = [
    { path: '/', label: 'Overview' },
    ...(vendors?.map(v => ({
      path: `/vendor/${v.vendorId}`,
      label: v.name,
    })) || []),
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Activity size={32} className="text-blue-600" strokeWidth={2.5} />
              <div>
                <h1 className="text-xl font-bold text-slate-900">SLA Performance Dashboard</h1>
                <p className="text-xs text-slate-500">Network Quality & Cost Monitoring</p>
              </div>
            </div>
          </div>

          <nav className="flex gap-1 -mb-px" role="tablist">
            {tabs.map(tab => {
              const isActive = location.pathname === tab.path;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  role="tab"
                  aria-selected={isActive}
                  className={`
                    px-6 py-3 font-medium text-sm border-b-2 transition-colors
                    ${isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }
                  `}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t-2 border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-slate-500 text-center">
            SLA Performance Dashboard - Production-Ready Vendor Monitoring
          </p>
        </div>
      </footer>
    </div>
  );
}
