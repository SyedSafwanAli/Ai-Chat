'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Package, Coins, Pencil, Trash2, Plus, X, Save, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PackagePlan {
  id: number;
  name: string;
  monthly_price: number;
  credit_limit: number;
  description: string;
}

const planStyle: Record<string, { border: string; badge: string; icon: string; bg: string }> = {
  trial:   { border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-800',   icon: 'text-amber-600',  bg: 'bg-amber-50'  },
  basic:   { border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-800',     icon: 'text-blue-600',   bg: 'bg-blue-50'   },
  pro:     { border: 'border-violet-200', badge: 'bg-violet-100 text-violet-800', icon: 'text-violet-600', bg: 'bg-violet-50' },
};

const defaultStyle = { border: 'border-gray-200', badge: 'bg-gray-100 text-gray-700', icon: 'text-gray-500', bg: 'bg-gray-50' };

function getStyle(name: string) {
  return planStyle[name.toLowerCase()] ?? defaultStyle;
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({ plan, onClose, onDone }: { plan: PackagePlan; onClose: () => void; onDone: () => void }) {
  const [price,   setPrice]   = useState(String(plan.monthly_price));
  const [credits, setCredits] = useState(String(plan.credit_limit));
  const [desc,    setDesc]    = useState(plan.description);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const save = async () => {
    setSaving(true); setError('');
    try {
      await api.put(`/super-admin/packages/${plan.name}`, {
        monthly_price: parseFloat(price) || 0,
        credit_limit:  parseInt(credits) || 0,
        description:   desc,
      });
      onDone(); onClose();
    } catch (e: unknown) { setError((e as Error).message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 capitalize">Edit {plan.name} Plan</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors"><X className="h-4 w-4 text-gray-500" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Monthly Price ($)</label>
            <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Credit Limit / Month</label>
            <input type="number" min="0" value={credits} onChange={e => setCredits(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
            <textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none" />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition-colors">
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [name,    setName]    = useState('');
  const [price,   setPrice]   = useState('0');
  const [credits, setCredits] = useState('0');
  const [desc,    setDesc]    = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const save = async () => {
    if (!name.trim()) { setError('Plan name is required.'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/super-admin/packages', {
        name: name.trim(),
        monthly_price: parseFloat(price) || 0,
        credit_limit:  parseInt(credits) || 0,
        description:   desc,
      });
      onDone(); onClose();
    } catch (e: unknown) { setError((e as Error).message || 'Failed to create plan.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Create New Plan</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors"><X className="h-4 w-4 text-gray-500" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Plan Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. enterprise"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Price ($/month)</label>
              <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Credits / Month</label>
              <input type="number" min="0" value={credits} onChange={e => setCredits(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
            <textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief plan description…"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none" />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition-colors">
            <Plus className="h-4 w-4" />
            {saving ? 'Creating…' : 'Create Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function PackagesPage() {
  const { user }  = useAuth();
  const router    = useRouter();
  const [plans,      setPlans]      = useState<PackagePlan[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [editPlan,   setEditPlan]   = useState<PackagePlan | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleting,   setDeleting]   = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'super_admin') { router.replace('/'); return; }
  }, [user, router]);

  const fetchPlans = useCallback(() => {
    setLoading(true);
    api.get<{ packages: PackagePlan[] }>('/super-admin/packages')
      .then(({ packages }) => setPlans(packages))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete "${name}" plan? This cannot be undone and will fail if any businesses are on this plan.`)) return;
    setDeleting(name);
    try {
      await api.delete(`/super-admin/packages/${name}`);
      fetchPlans();
    } catch (e: unknown) {
      alert((e as Error).message || 'Delete failed.');
    } finally { setDeleting(null); }
  };

  return (
    <MainLayout pageTitle="Package Plans" pageDescription="Manage pricing tiers and credit limits">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Package Plans</h2>
          <p className="text-sm text-gray-500 mt-0.5">Set prices, credit limits, and descriptions for each tier</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchPlans} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors shadow-sm">
            <Plus className="h-4 w-4" />
            New Plan
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="h-56 animate-pulse rounded-2xl bg-gray-100" />)}
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Package className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm">No package plans yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const s = getStyle(plan.name);
            return (
              <div key={plan.id} className={cn('relative rounded-2xl border-2 bg-white shadow-sm hover:shadow-md transition-all duration-200 flex flex-col', s.border)}>
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <span className={cn('rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider', s.badge)}>
                      {plan.name}
                    </span>
                    <div className={cn('rounded-xl p-2.5', s.bg)}>
                      <Package className={cn('h-5 w-5', s.icon)} />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-gray-900 mb-0.5">
                    ${Number(plan.monthly_price).toFixed(2)}
                    <span className="text-sm font-normal text-gray-400">/mo</span>
                  </p>
                  <div className="flex items-center gap-1.5 mt-3 mb-3">
                    <Coins className={cn('h-4 w-4', s.icon)} />
                    <span className="text-sm text-gray-600 font-medium">
                      {Number(plan.credit_limit).toLocaleString()} credits / month
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{plan.description || '—'}</p>
                </div>
                <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
                  <button onClick={() => setEditPlan(plan)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Plan
                  </button>
                  <button onClick={() => handleDelete(plan.name)} disabled={deleting === plan.name}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50">
                    <Trash2 className="h-3.5 w-3.5" />
                    {deleting === plan.name ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editPlan   && <EditModal   plan={editPlan}   onClose={() => setEditPlan(null)}   onDone={fetchPlans} />}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onDone={fetchPlans} />}
    </MainLayout>
  );
}
