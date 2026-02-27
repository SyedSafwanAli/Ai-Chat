'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { CreditCard, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditTx {
  id: number;
  business_name: string;
  admin_email: string;
  type: string;
  amount: number;
  notes: string | null;
  created_at: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function CreditsPage() {
  const { user }  = useAuth();
  const router    = useRouter();
  const [txs,      setTxs]      = useState<CreditTx[]>([]);
  const [pg,       setPg]       = useState<Pagination>({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading,  setLoading]  = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'super_admin') { router.replace('/'); return; }
  }, [user, router]);

  const fetch = useCallback((page = 1) => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), limit: '15', ...(typeFilter ? { type: typeFilter } : {}) });
    api.get<{ transactions: CreditTx[]; pagination: Pagination }>(`/super-admin/credit-transactions?${qs}`)
      .then(({ transactions, pagination }) => { setTxs(transactions); setPg(pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [typeFilter]);

  useEffect(() => { fetch(1); }, [fetch]);

  return (
    <MainLayout pageTitle="Credit Transactions" pageDescription="All credit history across businesses">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Credit Transactions</h2>
          <p className="text-sm text-gray-500 mt-0.5">{pg.total} transactions total</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20">
            <option value="">All Types</option>
            <option value="topup">Top-up</option>
            <option value="approve_grant">Approval Grant</option>
          </select>
          <button onClick={() => fetch(pg.page)} disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Business', 'Type', 'Amount', 'Notes', 'Admin', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5"><div className="h-4 w-24 animate-pulse rounded bg-gray-100" /></td>
                    ))}
                  </tr>
                ))
              ) : txs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <CreditCard className="mx-auto h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm text-gray-400">No credit transactions yet.</p>
                    <p className="text-xs text-gray-300 mt-1">Transactions appear when you top-up or approve businesses.</p>
                  </td>
                </tr>
              ) : txs.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-gray-900">{tx.business_name}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold',
                      tx.type === 'topup' ? 'bg-green-100 text-green-700' : 'bg-violet-100 text-violet-700')}>
                      {tx.type === 'topup' ? 'Top-up' : 'Approval Grant'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-green-600">+{Number(tx.amount).toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">{tx.notes || '—'}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">{tx.admin_email}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-400">
                    {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
