'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Search, ChevronLeft, ChevronRight,
  CheckCircle2, Ban, Coins, Calendar, X, Plus, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BusinessRow {
  id: number;
  business_name: string;
  package: string;
  package_expiry: string | null;
  total_credits_used: number;
  credits_remaining: number;
  created_at: string;
  user_id: number | null;
  owner_email: string | null;
  status: 'pending' | 'active' | 'suspended' | null;
  user_status?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pkgBadge(pkg: string) {
  const map: Record<string, string> = {
    pro:   'bg-violet-100 text-violet-700',
    basic: 'bg-blue-100 text-blue-700',
    trial: 'bg-amber-100 text-amber-700',
    none:  'bg-gray-100 text-gray-500',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize', map[pkg] ?? map.none)}>
      {pkg}
    </span>
  );
}

function statusBadge(status: string | null) {
  const map: Record<string, string> = {
    active:    'bg-green-100 text-green-700',
    pending:   'bg-amber-100 text-amber-700',
    suspended: 'bg-red-100 text-red-700',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize', status ? (map[status] ?? 'bg-gray-100 text-gray-500') : 'bg-gray-100 text-gray-500')}>
      {status ?? 'unknown'}
    </span>
  );
}

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function TopUpModal({ biz, onClose, onDone }: { biz: BusinessRow; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState('');
  const [error,  setError]  = useState('');
  const [saving, setSaving] = useState(false);
  const num = parseFloat(amount);
  const valid = !isNaN(num) && num > 0;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    setError('');
    try {
      await api.patch(`/super-admin/businesses/${biz.id}`, { top_up: num });
      onDone();
      onClose();
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to top up.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Top-up Credits</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors"><X className="h-4 w-4 text-gray-500" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">Business: <span className="font-semibold text-gray-900">{biz.business_name}</span></p>
          <div className="rounded-xl bg-gray-50 p-4 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Current Balance</span><span className="font-semibold text-gray-900">{Number(biz.credits_remaining).toLocaleString()}</span></div>
            {valid && <div className="flex justify-between text-green-600"><span>After Top-up</span><span className="font-semibold">{(Number(biz.credits_remaining) + num).toLocaleString()}</span></div>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Amount to Add</label>
            <input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 500"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={submit} disabled={!valid || saving}
            className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition-colors">
            {saving ? 'Adding…' : valid ? `Add ${num.toFixed(0)} Credits` : 'Add Credits'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ExtendModal({ biz, onClose, onDone }: { biz: BusinessRow; onClose: () => void; onDone: () => void }) {
  const [pkg,    setPkg]    = useState(biz.package || 'basic');
  const [expiry, setExpiry] = useState(biz.package_expiry ? biz.package_expiry.split('T')[0] : '');
  const [error,  setError]  = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true); setError('');
    try {
      await api.patch(`/super-admin/businesses/${biz.id}`, { package: pkg, package_expiry: expiry || null });
      onDone(); onClose();
    } catch (e: unknown) { setError((e as Error).message || 'Failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Extend Package</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors"><X className="h-4 w-4 text-gray-500" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">Business: <span className="font-semibold text-gray-900">{biz.business_name}</span></p>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Package</label>
            <select value={pkg} onChange={e => setPkg(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {['none','trial','basic','pro'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Expiry Date</label>
            <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            <div className="flex gap-2 mt-2">
              {[30,90,180,365].map(d => (
                <button key={d} onClick={() => setExpiry(addDays(d))}
                  className="flex-1 rounded-lg border border-gray-200 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  +{d}d
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Update Package'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ApproveModal({ biz, onClose, onDone }: { biz: BusinessRow; onClose: () => void; onDone: () => void }) {
  const [pkg,     setPkg]     = useState('basic');
  const [expiry,  setExpiry]  = useState(addDays(30));
  const [credits, setCredits] = useState('2000');
  const [error,   setError]   = useState('');
  const [saving,  setSaving]  = useState(false);

  const submit = async () => {
    setSaving(true); setError('');
    try {
      await api.patch(`/super-admin/businesses/${biz.id}/approve`, {
        package: pkg, package_expiry: expiry || null,
        top_up_credits: parseFloat(credits) || 0,
      });
      onDone(); onClose();
    } catch (e: unknown) { setError((e as Error).message || 'Approval failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Approve & Activate</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors"><X className="h-4 w-4 text-gray-500" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
            <p className="text-sm font-semibold text-emerald-800">{biz.business_name}</p>
            <p className="text-xs text-emerald-600 mt-0.5">{biz.owner_email}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Assign Package</label>
            <select value={pkg} onChange={e => setPkg(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
              {['trial','basic','pro'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Expiry Date</label>
            <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            <div className="flex gap-2 mt-2">
              {[30,90,180,365].map(d => (
                <button key={d} onClick={() => setExpiry(addDays(d))}
                  className="flex-1 rounded-lg border border-gray-200 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  +{d}d
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Initial Credits</label>
            <input type="number" min="0" value={credits} onChange={e => setCredits(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {saving ? 'Activating…' : 'Approve & Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddBusinessModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [pass,    setPass]    = useState('');
  const [pkg,     setPkg]     = useState('none');
  const [credits, setCredits] = useState('0');
  const [error,   setError]   = useState('');
  const [saving,  setSaving]  = useState(false);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !pass.trim()) { setError('Name, email and password are required.'); return; }
    if (pass.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/super-admin/businesses', { name: name.trim(), email: email.trim(), password: pass, package: pkg, initial_credits: parseFloat(credits) || 0 });
      onDone(); onClose();
    } catch (e: unknown) { setError((e as Error).message || 'Failed to create business.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Add New Business</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors"><X className="h-4 w-4 text-gray-500" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { label: 'Business Name', val: name, set: setName, type: 'text', ph: 'PizzaRun Karachi' },
            { label: 'Owner Email', val: email, set: setEmail, type: 'email', ph: 'owner@business.pk' },
            { label: 'Owner Password (min 8)', val: pass, set: setPass, type: 'password', ph: '••••••••' },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">{f.label}</label>
              <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Package</label>
              <select value={pkg} onChange={e => setPkg(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20">
                {['none','trial','basic','pro'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Initial Credits</label>
              <input type="number" min="0" value={credits} onChange={e => setCredits(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
            </div>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition-colors">
            {saving ? 'Creating…' : 'Create Business'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function BusinessesPage() {
  const { user }  = useAuth();
  const router    = useRouter();

  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [bizLoading, setBizLoading] = useState(true);
  const [search,      setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pkgFilter,    setPkgFilter]    = useState('');

  const [topUpBiz,   setTopUpBiz]   = useState<BusinessRow | null>(null);
  const [extendBiz,  setExtendBiz]  = useState<BusinessRow | null>(null);
  const [approveBiz, setApproveBiz] = useState<BusinessRow | null>(null);
  const [showAdd,    setShowAdd]    = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'super_admin') { router.replace('/'); return; }
  }, [user, router]);

  const fetchBusinesses = useCallback((page = 1) => {
    setBizLoading(true);
    const qs = new URLSearchParams({
      page: String(page), limit: '15',
      ...(search       ? { search }          : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(pkgFilter    ? { package: pkgFilter }  : {}),
    });
    api.get<{ businesses: BusinessRow[]; pagination: Pagination }>(`/super-admin/businesses?${qs}`)
      .then(({ businesses: rows, pagination: pg }) => { setBusinesses(rows); setPagination(pg); })
      .catch(() => {})
      .finally(() => setBizLoading(false));
  }, [search, statusFilter, pkgFilter]);

  useEffect(() => { fetchBusinesses(1); }, [fetchBusinesses]);

  const handleToggleStatus = async (biz: BusinessRow) => {
    const newStatus = biz.status === 'active' ? 'suspended' : 'active';
    try {
      await api.patch(`/super-admin/businesses/${biz.id}`, { status: newStatus });
      fetchBusinesses(pagination.page);
    } catch {}
  };

  return (
    <MainLayout pageTitle="Businesses" pageDescription="Manage all registered businesses">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Businesses</h2>
          <p className="text-sm text-gray-500 mt-0.5">{pagination.total} businesses total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchBusinesses(pagination.page)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors shadow-sm">
            <Plus className="h-4 w-4" />
            Add Business
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
        <select value={pkgFilter} onChange={e => setPkgFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20">
          <option value="">All Packages</option>
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
          <option value="trial">Trial</option>
          <option value="none">None</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Business', 'Package', 'Expiry', 'Credits Used', 'Balance', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bizLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5"><div className="h-4 w-24 animate-pulse rounded bg-gray-100" /></td>
                    ))}
                  </tr>
                ))
              ) : businesses.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">No businesses found.</td></tr>
              ) : businesses.map((biz) => (
                <tr key={biz.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-gray-900">{biz.business_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{biz.owner_email ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3.5">{pkgBadge(biz.package)}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">
                    {biz.package_expiry ? new Date(biz.package_expiry).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">{Number(biz.total_credits_used).toLocaleString()}</td>
                  <td className="px-4 py-3.5">
                    <span className={cn('text-sm font-semibold', Number(biz.credits_remaining) > 100 ? 'text-green-600' : Number(biz.credits_remaining) > 0 ? 'text-amber-600' : 'text-red-500')}>
                      {Number(biz.credits_remaining).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">{statusBadge(biz.status)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {biz.status === 'pending' && (
                        <button onClick={() => setApproveBiz(biz)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </button>
                      )}
                      <button onClick={() => setTopUpBiz(biz)}
                        className="flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors">
                        <Coins className="h-3.5 w-3.5" />
                        Top-up
                      </button>
                      <button onClick={() => setExtendBiz(biz)}
                        className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">
                        <Calendar className="h-3.5 w-3.5" />
                        Extend
                      </button>
                      {biz.status !== 'pending' && (
                        <button onClick={() => handleToggleStatus(biz)}
                          className={cn('flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                            biz.status === 'active' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100')}>
                          {biz.status === 'active' ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          {biz.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => fetchBusinesses(pagination.page - 1)} disabled={pagination.page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-xs text-gray-600 font-medium">{pagination.page} / {pagination.totalPages}</span>
              <button onClick={() => fetchBusinesses(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {topUpBiz   && <TopUpModal   biz={topUpBiz}   onClose={() => setTopUpBiz(null)}   onDone={() => fetchBusinesses(pagination.page)} />}
      {extendBiz  && <ExtendModal  biz={extendBiz}  onClose={() => setExtendBiz(null)}  onDone={() => fetchBusinesses(pagination.page)} />}
      {approveBiz && <ApproveModal biz={approveBiz} onClose={() => setApproveBiz(null)} onDone={() => fetchBusinesses(pagination.page)} />}
      {showAdd    && <AddBusinessModal onClose={() => setShowAdd(false)} onDone={() => fetchBusinesses(1)} />}
    </MainLayout>
  );
}
