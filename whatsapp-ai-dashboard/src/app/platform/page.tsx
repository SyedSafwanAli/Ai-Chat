'use client';

/**
 * Super Admin Platform Dashboard — /platform
 *
 * Privacy rules enforced client-side:
 *  - No customer conversations or messages are shown
 *  - Only aggregate AI credit stats per business
 *  - Support panel shows admin ↔ business-owner messages only
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CheckCircle2,
  Clock,
  Ban,
  Coins,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  Send,
  MessageSquare,
  RefreshCw,
  X,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlatformStats {
  totalBusinesses: number;
  activeBusinesses: number;
  pendingBusinesses: number;
  suspendedBusinesses: number;
  totalCreditsUsed: number;
  totalCreditsRemaining: number;
}

interface BusinessRow {
  id: number;
  business_name: string;
  package: 'none' | 'basic' | 'pro' | 'trial';
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

interface SupportThread {
  user_id: number;
  email: string;
  business_name: string;
  last_message: string;
  last_sender: 'user' | 'admin';
  last_message_at: string;
  unread_count: number;
}

interface SupportMessage {
  id: number;
  user_id: number;
  message: string;
  sender: 'user' | 'admin';
  created_at: string;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtCredits(val: number | string) {
  return Number(val).toFixed(2);
}

function truncate(str: string, n = 58) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color, sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className={cn('rounded-xl p-3', color)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-gray-400">—</span>;
  const map: Record<string, string> = {
    active:    'bg-emerald-50 text-emerald-700 ring-emerald-200',
    pending:   'bg-amber-50   text-amber-700   ring-amber-200',
    suspended: 'bg-rose-50    text-rose-700    ring-rose-200',
  };
  const label = status;
  return (
    <span className={cn(
      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 capitalize',
      map[status] ?? 'bg-gray-100 text-gray-600 ring-gray-200'
    )}>
      {label}
    </span>
  );
}

function PackageBadge({ pkg }: { pkg: string }) {
  const map: Record<string, string> = {
    none:  'bg-gray-100  text-gray-500',
    basic: 'bg-blue-50   text-blue-700',
    pro:   'bg-violet-50 text-violet-700',
    trial: 'bg-amber-50  text-amber-700',
  };
  return (
    <span className={cn(
      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
      map[pkg] ?? 'bg-gray-100 text-gray-500'
    )}>
      {pkg}
    </span>
  );
}

// ─── Top-up Credits Modal ─────────────────────────────────────────────────────

function TopUpModal({
  biz, onClose, onSave,
}: {
  biz: BusinessRow;
  onClose: () => void;
  onSave: (id: number, amount: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const parsed     = parseFloat(amount);
  const isValid    = !isNaN(parsed) && parsed > 0;
  const current    = Number(biz.credits_remaining);
  const afterTopUp = isValid ? current + parsed : current;

  async function handleSave() {
    if (!isValid) { setError('Enter a valid positive amount.'); return; }
    setSaving(true);
    try {
      await onSave(biz.id, parsed);
    } catch {
      setError('Top-up failed. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-violet-100 p-2">
              <Coins className="h-4 w-4 text-violet-700" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Top-up Credits</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Business name */}
        <p className="mb-3 text-sm font-medium text-gray-700">{biz.business_name}</p>

        {/* Balance preview */}
        <div className="mb-4 rounded-xl bg-gray-50 px-4 py-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Current balance</span>
            <span className="font-semibold text-gray-700">{fmtCredits(current)} credits</span>
          </div>
          {isValid && (
            <div className="flex justify-between text-xs">
              <span className="text-emerald-600">After top-up</span>
              <span className="font-bold text-emerald-700">{fmtCredits(afterTopUp)} credits</span>
            </div>
          )}
        </div>

        {/* Amount input */}
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Amount to add (credits)
        </label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="e.g. 500"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(''); }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          autoFocus
        />
        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isValid}
            className="flex-1 rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Processing…' : `Add ${isValid ? fmtCredits(parsed) : '0'} Credits`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Extend Package Modal ─────────────────────────────────────────────────────

function ExtendModal({
  biz, onClose, onSave,
}: {
  biz: BusinessRow;
  onClose: () => void;
  onSave: (id: number, pkg: string, expiry: string) => Promise<void>;
}) {
  const [pkg,    setPkg]    = useState<string>(biz.package);
  const [expiry, setExpiry] = useState(
    biz.package_expiry ? biz.package_expiry.slice(0, 10) : ''
  );
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  // Quick preset: add N days from today
  function addDays(n: number) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    setExpiry(d.toISOString().slice(0, 10));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(biz.id, pkg, expiry);
    } catch {
      setError('Update failed. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-blue-100 p-2">
              <Calendar className="h-4 w-4 text-blue-700" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Extend Package</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <p className="mb-4 text-sm font-medium text-gray-700">{biz.business_name}</p>

        {/* Package select */}
        <label className="mb-1 block text-xs font-medium text-gray-700">Package tier</label>
        <select
          value={pkg}
          onChange={(e) => setPkg(e.target.value)}
          className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="none">None</option>
          <option value="trial">Trial</option>
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
        </select>

        {/* Expiry date */}
        <label className="mb-1 block text-xs font-medium text-gray-700">Expiry date</label>
        <input
          type="date"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Quick presets */}
        <div className="mb-3 flex gap-1.5">
          {[30, 90, 180, 365].map((d) => (
            <button
              key={d}
              onClick={() => addDays(d)}
              className="flex-1 rounded-lg border border-gray-200 py-1 text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
            >
              +{d}d
            </button>
          ))}
        </div>

        {error && <p className="mb-2 text-xs text-rose-500">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Update Package'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Approve Business Modal ───────────────────────────────────────────────────

function ApproveModal({
  biz, onClose, onSave,
}: {
  biz: BusinessRow;
  onClose: () => void;
  onSave: (id: number, pkg: string, expiry: string, credits: number) => Promise<void>;
}) {
  const [pkg,     setPkg]     = useState('trial');
  const [expiry,  setExpiry]  = useState('');
  const [credits, setCredits] = useState('100');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  function addDays(n: number) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    setExpiry(d.toISOString().slice(0, 10));
  }

  async function handleSave() {
    if (!expiry) { setError('Please select an expiry date.'); return; }
    setSaving(true);
    try {
      await onSave(biz.id, pkg, expiry, parseFloat(credits) || 0);
    } catch {
      setError('Approval failed. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-100 p-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Approve & Assign Plan</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <p className="mb-4 text-sm font-medium text-gray-700">{biz.business_name}</p>
        <p className="mb-4 text-xs text-gray-400">{biz.owner_email}</p>

        {/* Package */}
        <label className="mb-1 block text-xs font-medium text-gray-700">Package</label>
        <select
          value={pkg}
          onChange={(e) => setPkg(e.target.value)}
          className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="trial">Trial</option>
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
        </select>

        {/* Expiry */}
        <label className="mb-1 block text-xs font-medium text-gray-700">Expiry date</label>
        <input
          type="date"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <div className="mb-3 flex gap-1.5">
          {[30, 90, 180, 365].map((d) => (
            <button
              key={d}
              onClick={() => addDays(d)}
              className="flex-1 rounded-lg border border-gray-200 py-1 text-xs text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
            >
              +{d}d
            </button>
          ))}
        </div>

        {/* Initial credits */}
        <label className="mb-1 block text-xs font-medium text-gray-700">Initial credits</label>
        <input
          type="number"
          min="0"
          step="1"
          value={credits}
          onChange={(e) => setCredits(e.target.value)}
          className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        {error && <p className="mb-2 text-xs text-rose-500">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Approving…' : 'Approve & Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlatformPage() {
  const { user } = useAuth();
  const router   = useRouter();

  // Redirect non-super-admins immediately
  useEffect(() => {
    if (user && user.role !== 'super_admin') router.replace('/');
  }, [user, router]);

  // ── UI tab ────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<'businesses' | 'support'>('businesses');

  // ── Stats ─────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<PlatformStats | null>(null);

  // ── Businesses ────────────────────────────────────────────────────────────
  const [businesses,   setBusinesses]   = useState<BusinessRow[]>([]);
  const [pagination,   setPagination]   = useState<Pagination>({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [bizLoading,   setBizLoading]   = useState(true);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pkgFilter,    setPkgFilter]    = useState('');

  // ── Modals ────────────────────────────────────────────────────────────────
  const [topUpBiz,   setTopUpBiz]   = useState<BusinessRow | null>(null);
  const [extendBiz,  setExtendBiz]  = useState<BusinessRow | null>(null);
  const [approveBiz, setApproveBiz] = useState<BusinessRow | null>(null);

  // ── Support ───────────────────────────────────────────────────────────────
  const [threads,         setThreads]         = useState<SupportThread[]>([]);
  const [threadsLoading,  setThreadsLoading]  = useState(false);
  const [activeUserId,    setActiveUserId]    = useState<number | null>(null);
  const [messages,        setMessages]        = useState<SupportMessage[]>([]);
  const [msgsLoading,     setMsgsLoading]     = useState(false);
  const [replyText,       setReplyText]       = useState('');
  const [replySending,    setReplySending]    = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Fetch helpers ─────────────────────────────────────────────────────────

  const fetchStats = useCallback(() => {
    api.get<PlatformStats>('/super-admin/stats')
      .then(setStats)
      .catch(() => {});
  }, []);

  const fetchBusinesses = useCallback((page = 1) => {
    setBizLoading(true);
    const qs = new URLSearchParams({
      page: String(page), limit: '15',
      ...(search       ? { search }              : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(pkgFilter    ? { package: pkgFilter }   : {}),
    });
    api.get<{ businesses: BusinessRow[]; pagination: Pagination }>(
      `/super-admin/businesses?${qs}`
    )
      .then(({ businesses: rows, pagination: pg }) => {
        setBusinesses(rows);
        setPagination(pg);
      })
      .catch(() => {})
      .finally(() => setBizLoading(false));
  }, [search, statusFilter, pkgFilter]);

  const fetchThreads = useCallback(() => {
    setThreadsLoading(true);
    api.get<{ threads: SupportThread[] }>('/super-admin/support')
      .then(({ threads: t }) => setThreads(t))
      .catch(() => {})
      .finally(() => setThreadsLoading(false));
  }, []);

  const loadMessages = useCallback((userId: number) => {
    setActiveUserId(userId);
    setMsgsLoading(true);
    setMessages([]);
    api.get<{ messages: SupportMessage[] }>(`/super-admin/support/${userId}`)
      .then(({ messages: msgs }) => setMessages(msgs))
      .catch(() => {})
      .finally(() => setMsgsLoading(false));
  }, []);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchBusinesses(1); }, [fetchBusinesses]);
  useEffect(() => {
    if (tab === 'support') fetchThreads();
  }, [tab, fetchThreads]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Business actions ──────────────────────────────────────────────────────

  async function handleToggleStatus(biz: BusinessRow) {
    const newStatus = biz.status === 'suspended' ? 'active' : 'suspended';
    await api.patch(`/super-admin/businesses/${biz.id}`, { status: newStatus });
    fetchBusinesses(pagination.page);
    fetchStats();
  }

  async function handleApprove(id: number, pkg: string, expiry: string, credits: number) {
    await api.patch(`/super-admin/businesses/${id}/approve`, {
      package: pkg,
      package_expiry: expiry,
      top_up_credits: credits,
    });
    setApproveBiz(null);
    fetchBusinesses(pagination.page);
    fetchStats();
  }

  async function handleTopUp(id: number, amount: number) {
    await api.patch(`/super-admin/businesses/${id}`, { top_up: amount });
    setTopUpBiz(null);
    fetchBusinesses(pagination.page);
    fetchStats();
  }

  async function handleExtend(id: number, pkg: string, expiry: string) {
    await api.patch(`/super-admin/businesses/${id}`, {
      package: pkg,
      ...(expiry ? { package_expiry: expiry } : {}),
    });
    setExtendBiz(null);
    fetchBusinesses(pagination.page);
  }

  // ── Support reply ─────────────────────────────────────────────────────────

  async function handleReply() {
    if (!replyText.trim() || activeUserId === null) return;
    setReplySending(true);
    try {
      await api.post(`/super-admin/support/${activeUserId}`, { message: replyText.trim() });
      setReplyText('');
      loadMessages(activeUserId);
      fetchThreads(); // refresh unread counts
    } finally {
      setReplySending(false);
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const activeThread   = threads.find((t) => t.user_id === activeUserId);
  const totalUnread    = threads.reduce((s, t) => s + Number(t.unread_count), 0);

  if (user?.role !== 'super_admin') return null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <MainLayout pageTitle="Platform Admin" pageDescription="Global tenant management · billing · support">

      {/* ── KPI Stats ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-6">
        <StatCard
          label="Total Businesses"
          value={stats?.totalBusinesses ?? '—'}
          icon={Building2}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Active"
          value={stats?.activeBusinesses ?? '—'}
          icon={CheckCircle2}
          color="bg-emerald-50 text-emerald-600"
          sub="valid package"
        />
        <StatCard
          label="Pending Approval"
          value={stats?.pendingBusinesses ?? '—'}
          icon={Clock}
          color="bg-amber-50 text-amber-600"
          sub="awaiting activation"
        />
        <StatCard
          label="Suspended"
          value={stats?.suspendedBusinesses ?? '—'}
          icon={Ban}
          color="bg-rose-50 text-rose-600"
        />
        <StatCard
          label="Total Credits Used"
          value={stats ? fmtCredits(stats.totalCreditsUsed) : '—'}
          icon={Coins}
          color="bg-violet-50 text-violet-600"
          sub="all businesses"
        />
        <StatCard
          label="Credits Remaining"
          value={stats ? fmtCredits(stats.totalCreditsRemaining) : '—'}
          icon={ShieldCheck}
          color="bg-teal-50 text-teal-600"
          sub="total balance pool"
        />
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {(['businesses', 'support'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'relative rounded-lg px-5 py-2 text-sm font-medium transition-colors',
                tab === t
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {t === 'businesses' ? 'Businesses' : 'Support Threads'}
              {t === 'support' && totalUnread > 0 && (
                <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Refresh button (businesses tab) */}
        {tab === 'businesses' && (
          <button
            onClick={() => { fetchBusinesses(pagination.page); fetchStats(); }}
            className="ml-auto rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          BUSINESSES TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'businesses' && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-card">

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search business name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>

            {/* Package filter */}
            <select
              value={pkgFilter}
              onChange={(e) => setPkgFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">All Packages</option>
              <option value="none">None</option>
              <option value="trial">Trial</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {[
                    'Business', 'Package', 'Expiry',
                    'Credits Used', 'Credits Left', 'Status', 'Actions',
                  ].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bizLoading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
                    </td>
                  </tr>
                ) : businesses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                      No businesses found.
                    </td>
                  </tr>
                ) : businesses.map((biz) => (
                  <tr key={biz.id} className="transition-colors hover:bg-gray-50/50">

                    {/* Business */}
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900">{biz.business_name}</p>
                      <p className="text-[10px] text-gray-400">{biz.owner_email ?? '—'}</p>
                    </td>

                    {/* Package */}
                    <td className="px-5 py-3.5">
                      <PackageBadge pkg={biz.package} />
                    </td>

                    {/* Expiry */}
                    <td className="whitespace-nowrap px-5 py-3.5 text-xs text-gray-500">
                      {fmtDate(biz.package_expiry)}
                    </td>

                    {/* Credits Used */}
                    <td className="px-5 py-3.5 font-medium text-gray-700">
                      {fmtCredits(biz.total_credits_used)}
                    </td>

                    {/* Credits Remaining */}
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        'font-semibold',
                        Number(biz.credits_remaining) <= 0
                          ? 'text-rose-600'
                          : Number(biz.credits_remaining) < 100
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                      )}>
                        {fmtCredits(biz.credits_remaining)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={biz.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">

                        {/* Approve (pending only) */}
                        {biz.status === 'pending' && (
                          <button
                            onClick={() => setApproveBiz(biz)}
                            title="Approve & Assign Plan"
                            className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Top-up credits */}
                        <button
                          onClick={() => setTopUpBiz(biz)}
                          title="Top-up Credits"
                          className="rounded-lg bg-violet-50 p-1.5 text-violet-600 hover:bg-violet-100 transition-colors"
                        >
                          <Coins className="h-3.5 w-3.5" />
                        </button>

                        {/* Extend package */}
                        <button
                          onClick={() => setExtendBiz(biz)}
                          title="Extend Package"
                          className="rounded-lg bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                        </button>

                        {/* Suspend / Activate (non-pending) */}
                        {biz.status !== 'pending' && (
                          <button
                            onClick={() => handleToggleStatus(biz)}
                            title={biz.status === 'suspended' ? 'Activate' : 'Suspend'}
                            className={cn(
                              'rounded-lg p-1.5 transition-colors',
                              biz.status === 'suspended'
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                            )}
                          >
                            {biz.status === 'suspended'
                              ? <CheckCircle2 className="h-3.5 w-3.5" />
                              : <Ban className="h-3.5 w-3.5" />
                            }
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
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
              <p className="text-xs text-gray-500">
                {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} businesses
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => fetchBusinesses(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => fetchBusinesses(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUPPORT TAB — admin ↔ business-owner only, no customer data
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: 580 }}>

          {/* ── Thread list ─────────────────────────────────────────────── */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">Business Threads</h3>
              <button
                onClick={fetchThreads}
                className="rounded p-1 text-gray-400 hover:bg-gray-100"
                title="Refresh"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {threadsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-5 w-5 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
                </div>
              ) : threads.length === 0 ? (
                <div className="py-12 text-center">
                  <MessageSquare className="mx-auto mb-2 h-8 w-8 text-gray-200" />
                  <p className="text-sm text-gray-400">No support threads yet.</p>
                </div>
              ) : threads.map((t) => (
                <button
                  key={t.user_id}
                  onClick={() => loadMessages(t.user_id)}
                  className={cn(
                    'w-full border-b border-gray-50 px-4 py-3.5 text-left transition-colors',
                    activeUserId === t.user_id ? 'bg-violet-50' : 'hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {t.business_name}
                        </p>
                        {Number(t.unread_count) > 0 && (
                          <span className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                            {t.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[10px] text-gray-400">{t.email}</p>
                    </div>
                    <span className="whitespace-nowrap text-[10px] text-gray-400">
                      {fmtDate(t.last_message_at)}
                    </span>
                  </div>
                  {/* Last message snippet */}
                  <p className={cn(
                    'mt-1 truncate text-xs',
                    Number(t.unread_count) > 0
                      ? 'font-medium text-gray-700'
                      : 'text-gray-400'
                  )}>
                    {t.last_sender === 'admin' ? 'You: ' : ''}
                    {truncate(t.last_message)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Chat pane ───────────────────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
            {!activeThread ? (
              /* Empty state */
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-gray-300">
                <MessageSquare className="h-12 w-12" />
                <p className="text-sm">Select a business thread to view messages</p>
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div className="border-b border-gray-100 px-5 py-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {activeThread.business_name}
                  </p>
                  <p className="text-xs text-gray-400">{activeThread.email}</p>
                </div>

                {/* Messages */}
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {msgsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="h-5 w-5 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-400">No messages yet.</p>
                  ) : messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn('flex', msg.sender === 'admin' ? 'justify-end' : 'justify-start')}
                    >
                      <div className={cn(
                        'max-w-[75%] rounded-2xl px-4 py-2.5',
                        msg.sender === 'admin'
                          ? 'rounded-br-sm bg-violet-600 text-white'
                          : 'rounded-bl-sm bg-gray-100 text-gray-900'
                      )}>
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                        <p className={cn(
                          'mt-1 text-[10px]',
                          msg.sender === 'admin' ? 'text-violet-200' : 'text-gray-400'
                        )}>
                          {fmtTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* Reply box */}
                <div className="flex items-end gap-2 border-t border-gray-100 p-3">
                  <textarea
                    rows={1}
                    placeholder="Type a reply… (Enter to send)"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleReply();
                      }
                    }}
                    className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <button
                    onClick={handleReply}
                    disabled={replySending || !replyText.trim()}
                    className="rounded-xl bg-violet-600 p-2.5 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {approveBiz && (
        <ApproveModal
          biz={approveBiz}
          onClose={() => setApproveBiz(null)}
          onSave={handleApprove}
        />
      )}
      {topUpBiz && (
        <TopUpModal
          biz={topUpBiz}
          onClose={() => setTopUpBiz(null)}
          onSave={handleTopUp}
        />
      )}
      {extendBiz && (
        <ExtendModal
          biz={extendBiz}
          onClose={() => setExtendBiz(null)}
          onSave={handleExtend}
        />
      )}
    </MainLayout>
  );
}
