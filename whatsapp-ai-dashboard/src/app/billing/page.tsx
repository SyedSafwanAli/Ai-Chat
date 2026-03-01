'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { api } from '@/lib/api';
import {
  CreditCard, Zap, CheckCircle2, AlertCircle, RefreshCw,
  Calendar, Coins, Package, Crown, ArrowUpCircle, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BusinessInfo {
  name:           string;
  package:        string;
  package_expiry: string | null;
  credit_balance: number;
  credits_used:   number;
  status:         string;
}

interface PlanConfig {
  name:         string;
  price:        number;
  credits:      number;
  durationDays: number;
  features:     string[];
}

interface Payment {
  id:                       number;
  order_ref:                string;
  amount:                   number;
  currency:                 string;
  package_type:             string;
  status:                   'pending' | 'success' | 'failed';
  easypaisa_transaction_id: string | null;
  created_at:               string;
  paid_at:                  string | null;
}

interface BillingData {
  business:    BusinessInfo;
  packageMeta: PlanConfig | null;
  plans:       Record<string, PlanConfig>;
  payments:    Payment[];
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const PKG_BADGE: Record<string, string> = {
  basic: 'bg-blue-100 text-blue-700',
  pro:   'bg-violet-100 text-violet-700',
  trial: 'bg-amber-100 text-amber-700',
  none:  'bg-gray-100 text-gray-500',
};

const PAY_STATUS: Record<string, { label: string; cls: string }> = {
  success: { label: 'Paid',    cls: 'bg-green-100 text-green-700' },
  pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-700' },
  failed:  { label: 'Failed',  cls: 'bg-red-100 text-red-600'    },
};

// ─── Payment status banner (reads query param ?payment=) ──────────────────────

function PaymentBanner() {
  const params  = useSearchParams();
  const status  = params.get('payment');
  if (!status) return null;

  if (status === 'success') {
    return (
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-800">Payment Successful!</p>
          <p className="text-xs text-green-600 mt-0.5">Your package has been upgraded. Credits have been added to your account.</p>
        </div>
      </div>
    );
  }
  if (status === 'failed') {
    return (
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-700">Payment Failed</p>
          <p className="text-xs text-red-500 mt-0.5">Your payment was not completed. Please try again below.</p>
        </div>
      </div>
    );
  }
  return null;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const [data,       setData]       = useState<BillingData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [upgrading,  setUpgrading]  = useState<string | null>(null);
  const [error,      setError]      = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get<BillingData>('/payments/billing-info')
      .then(setData)
      .catch(() => setError('Failed to load billing info.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpgrade = async (packageType: string) => {
    setUpgrading(packageType);
    setError('');
    try {
      const res = await api.post<{ checkout_url: string }>('/payments/create', { package_type: packageType });
      // Redirect to Easypaisa hosted checkout
      window.location.href = res.checkout_url;
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to create payment session.');
      setUpgrading(null);
    }
  };

  const biz          = data?.business;
  const currentPkg   = biz?.package ?? 'none';
  const isExpired    = biz?.package_expiry ? new Date(biz.package_expiry) < new Date() : true;
  const daysLeft     = biz?.package_expiry
    ? Math.max(0, Math.ceil((new Date(biz.package_expiry).getTime() - Date.now()) / 86_400_000))
    : 0;

  return (
    <MainLayout pageTitle="Billing" pageDescription="Manage your subscription and credits">
      <div className="max-w-4xl mx-auto">

        {/* Payment result banner */}
        <Suspense fallback={null}>
          <PaymentBanner />
        </Suspense>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Billing & Subscription</h2>
            <p className="text-sm text-gray-500 mt-0.5">Upgrade your plan to unlock more AI credits</p>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-100" />)}
          </div>
        ) : (
          <>
            {/* ── Current Plan Card ──────────────────────────────────────── */}
            <div className={cn(
              'rounded-2xl border p-6 mb-6',
              currentPkg === 'pro'   ? 'border-violet-200 bg-violet-50'  :
              currentPkg === 'basic' ? 'border-blue-200   bg-blue-50'    :
              currentPkg === 'trial' ? 'border-amber-200  bg-amber-50'   :
                                       'border-gray-200   bg-gray-50'
            )}>
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl',
                    currentPkg === 'pro'   ? 'bg-violet-200' :
                    currentPkg === 'basic' ? 'bg-blue-200'   :
                    currentPkg === 'trial' ? 'bg-amber-200'  : 'bg-gray-200'
                  )}>
                    {currentPkg === 'pro'
                      ? <Crown   className="h-5 w-5 text-violet-700" />
                      : <Package className="h-5 w-5 text-gray-600"   />}
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-900 capitalize">{currentPkg === 'none' ? 'No Active Plan' : `${currentPkg} Plan`}</p>
                    <span className={cn('inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize', PKG_BADGE[currentPkg] ?? PKG_BADGE.none)}>
                      {biz?.status ?? 'inactive'}
                    </span>
                  </div>
                </div>
                {(isExpired || currentPkg === 'none') && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                    {currentPkg === 'none' ? 'No Plan' : 'Expired'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl bg-white/70 px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Coins className="h-3.5 w-3.5 text-amber-500" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Credits Left</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{(biz?.credit_balance ?? 0).toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-white/70 px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="h-3.5 w-3.5 text-blue-500" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Credits Used</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{(biz?.credits_used ?? 0).toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-white/70 px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-green-500" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Expiry</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {biz?.package_expiry
                      ? new Date(biz.package_expiry).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </p>
                </div>
                <div className="rounded-xl bg-white/70 px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="h-3.5 w-3.5 text-violet-500" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Days Left</p>
                  </div>
                  <p className={cn('text-lg font-bold', daysLeft <= 5 ? 'text-red-600' : 'text-gray-900')}>
                    {currentPkg === 'none' ? '—' : `${daysLeft}d`}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Upgrade Plan Cards ─────────────────────────────────────── */}
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              {currentPkg === 'none' ? 'Choose a Plan to Get Started' : 'Upgrade or Renew Your Plan'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {Object.entries(data?.plans ?? {}).map(([key, plan]) => {
                const isCurrent = key === currentPkg && !isExpired;
                const isPro     = key === 'pro';

                return (
                  <div key={key} className={cn(
                    'relative rounded-2xl border p-6 flex flex-col transition-shadow hover:shadow-md',
                    isPro ? 'border-violet-300 bg-white shadow-md' : 'border-gray-200 bg-white',
                    isCurrent && 'ring-2 ring-blue-500'
                  )}>
                    {isPro && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-violet-600 px-3 py-1 text-[11px] font-bold text-white shadow">
                        <Crown className="h-3 w-3" /> Most Popular
                      </span>
                    )}
                    {isCurrent && (
                      <span className="absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold text-white shadow">
                        <CheckCircle2 className="h-3 w-3" /> Current Plan
                      </span>
                    )}

                    <div className="mb-4">
                      <p className="text-base font-bold text-gray-900 capitalize">{plan.name}</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-extrabold text-gray-900">
                          PKR {plan.price.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-400">/ month</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{plan.credits.toLocaleString()} AI credits included</p>
                    </div>

                    <ul className="space-y-2 mb-6 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                          <CheckCircle2 className={cn('h-4 w-4 flex-shrink-0', isPro ? 'text-violet-500' : 'text-blue-500')} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleUpgrade(key)}
                      disabled={upgrading !== null}
                      className={cn(
                        'flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-60',
                        isPro
                          ? 'bg-violet-600 text-white hover:bg-violet-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      )}
                    >
                      {upgrading === key ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Redirecting to Easypaisa…
                        </>
                      ) : (
                        <>
                          <ArrowUpCircle className="h-4 w-4" />
                          {isCurrent ? `Renew ${plan.name}` : `Get ${plan.name}`}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* ── Payment History ────────────────────────────────────────── */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                <CreditCard className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Payment History</h3>
              </div>

              {data?.payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                  <CreditCard className="h-8 w-8 mb-2" />
                  <p className="text-xs text-gray-400">No payments yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        {['Order Ref', 'Plan', 'Amount', 'Status', 'Date', 'EP Transaction'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data?.payments.map((pay) => {
                        const st = PAY_STATUS[pay.status] ?? PAY_STATUS.pending;
                        return (
                          <tr key={pay.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-xs font-mono text-gray-500">{pay.order_ref || '—'}</td>
                            <td className="px-4 py-3">
                              <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize', PKG_BADGE[pay.package_type] ?? PKG_BADGE.none)}>
                                {pay.package_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                              PKR {Number(pay.amount).toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', st.cls)}>
                                {st.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                              {new Date(pay.created_at).toLocaleDateString('en-PK')}
                            </td>
                            <td className="px-4 py-3 text-xs font-mono text-gray-400 truncate max-w-[140px]">
                              {pay.easypaisa_transaction_id || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
