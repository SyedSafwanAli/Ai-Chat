'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ScrollText, ChevronLeft, ChevronRight, Search, RefreshCw, X } from 'lucide-react';

interface AuditLog {
  id: number;
  action: string;
  admin_email: string;
  target_business_name: string | null;
  created_at: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AuditPage() {
  const { user }  = useAuth();
  const router    = useRouter();
  const [logs,    setLogs]    = useState<AuditLog[]>([]);
  const [pg,      setPg]      = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [from,    setFrom]    = useState('');
  const [to,      setTo]      = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'super_admin') { router.replace('/'); return; }
  }, [user, router]);

  const fetch = useCallback((page = 1) => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) qs.set('search', search);
    if (from)   qs.set('from', from);
    if (to)     qs.set('to', to);
    api.get<{ logs: AuditLog[]; pagination: Pagination }>(`/super-admin/audit-logs?${qs}`)
      .then(({ logs: l, pagination }) => { setLogs(l); setPg(pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, from, to]);

  useEffect(() => { fetch(1); }, [fetch]);

  const clearFilters = () => { setSearch(''); setFrom(''); setTo(''); };
  const hasFilters = search || from || to;

  return (
    <MainLayout pageTitle="Audit Logs" pageDescription="Track all platform actions">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Audit Logs</h2>
          <p className="text-sm text-gray-500 mt-0.5">{pg.total} total actions logged</p>
        </div>
        <button onClick={() => fetch(pg.page)} disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by action…"
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium whitespace-nowrap">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium whitespace-nowrap">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['#', 'Action', 'Admin', 'Target Business', 'Date & Time'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5"><div className="h-4 w-24 animate-pulse rounded bg-gray-100" /></td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <ScrollText className="mx-auto h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm text-gray-400">No audit logs found.</p>
                    {hasFilters && <p className="text-xs text-gray-300 mt-1">Try clearing your filters.</p>}
                  </td>
                </tr>
              ) : logs.map((log, idx) => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors">
                  <td className="px-4 py-3.5 text-xs text-gray-400 font-mono">{((pg.page - 1) * pg.limit) + idx + 1}</td>
                  <td className="px-4 py-3.5 max-w-[320px]">
                    <p className="text-xs font-mono text-gray-700 break-all leading-relaxed">{log.action}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">{log.admin_email}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">{log.target_business_name ?? '—'}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pg.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {((pg.page - 1) * pg.limit) + 1}–{Math.min(pg.page * pg.limit, pg.total)} of {pg.total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => fetch(pg.page - 1)} disabled={pg.page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-xs text-gray-600 font-medium">{pg.page} / {pg.totalPages}</span>
              <button onClick={() => fetch(pg.page + 1)} disabled={pg.page >= pg.totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
