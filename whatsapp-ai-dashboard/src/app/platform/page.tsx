'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Package,
  CreditCard,
  ScrollText,
  LifeBuoy,
  Megaphone,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface PlatformStats {
  totalBusinesses: number;
  activeBusinesses: number;
  pendingBusinesses: number;
  suspendedBusinesses: number;
  totalCreditsUsed: number;
  totalCreditsRemaining: number;
}

interface RecentLog {
  id: number;
  action: string;
  admin_email: string;
  target_business_name: string | null;
  created_at: string;
}

const quickNav = [
  {
    href: '/platform/businesses',
    icon: Building2,
    label: 'Businesses',
    desc: 'Manage all registered businesses',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    border: 'hover:border-blue-200',
  },
  {
    href: '/platform/packages',
    icon: Package,
    label: 'Package Plans',
    desc: 'Manage pricing tiers & credit limits',
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50',
    border: 'hover:border-violet-200',
  },
  {
    href: '/platform/credits',
    icon: CreditCard,
    label: 'Credits',
    desc: 'View all credit transactions',
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50',
    border: 'hover:border-green-200',
  },
  {
    href: '/platform/audit',
    icon: ScrollText,
    label: 'Audit Logs',
    desc: 'Track all platform actions',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    border: 'hover:border-amber-200',
  },
  {
    href: '/platform/support',
    icon: LifeBuoy,
    label: 'Support Center',
    desc: 'Business support threads',
    iconColor: 'text-sky-600',
    iconBg: 'bg-sky-50',
    border: 'hover:border-sky-200',
  },
  {
    href: '/platform/announcements',
    icon: Megaphone,
    label: 'Announcements',
    desc: 'Post notices to all businesses',
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50',
    border: 'hover:border-orange-200',
  },
  {
    href: '/platform/analytics',
    icon: BarChart3,
    label: 'Analytics',
    desc: 'Platform-wide charts & insights',
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-50',
    border: 'hover:border-teal-200',
  },
];

export default function PlatformOverviewPage() {
  const { user }  = useAuth();
  const router    = useRouter();
  const [stats, setStats]     = useState<PlatformStats | null>(null);
  const [logs,  setLogs]      = useState<RecentLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      api.get<PlatformStats>('/super-admin/stats'),
      api.get<{ logs: RecentLog[] }>('/super-admin/audit-logs?page=1&limit=5'),
    ]).then(([statsRes, logsRes]) => {
      if (statsRes.status === 'fulfilled') setStats(statsRes.value as PlatformStats);
      if (logsRes.status === 'fulfilled')  setLogs((logsRes.value as { logs: RecentLog[] }).logs);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'super_admin') { router.replace('/'); return; }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const kpiCards = [
    { label: 'Total Businesses',   value: stats?.totalBusinesses,      icon: Building2,    iconColor: 'text-blue-600',   iconBg: 'bg-blue-50'   },
    { label: 'Active',             value: stats?.activeBusinesses,      icon: CheckCircle2, iconColor: 'text-green-600',  iconBg: 'bg-green-50'  },
    { label: 'Pending Approval',   value: stats?.pendingBusinesses,     icon: Clock,        iconColor: 'text-amber-600',  iconBg: 'bg-amber-50'  },
    { label: 'Suspended',          value: stats?.suspendedBusinesses,   icon: Ban,          iconColor: 'text-red-600',    iconBg: 'bg-red-50'    },
    { label: 'Total Credits Used', value: stats?.totalCreditsUsed,      icon: Coins,        iconColor: 'text-violet-600', iconBg: 'bg-violet-50' },
    { label: 'Credits Remaining',  value: stats?.totalCreditsRemaining, icon: ShieldCheck,  iconColor: 'text-teal-600',   iconBg: 'bg-teal-50'   },
  ];

  return (
    <MainLayout pageTitle="Platform Admin" pageDescription="Global overview & quick access">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Platform Overview</h2>
          <p className="text-sm text-gray-500 mt-0.5">Real-time stats across all businesses</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider leading-tight">{card.label}</p>
                <div className={`rounded-lg p-2 ${card.iconBg}`}>
                  <Icon className={`h-4 w-4 ${card.iconColor}`} />
                </div>
              </div>
              {loading ? (
                <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {Number(card.value ?? 0).toLocaleString()}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Navigation */}
      <div className="mb-8">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Access</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {quickNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${item.border}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`rounded-lg p-2.5 ${item.iconBg}`}>
                    <Icon className={`h-5 w-5 ${item.iconColor}`} />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors mt-1" />
                </div>
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
          <Link href="/platform/audit" className="text-xs text-violet-600 hover:text-violet-700 font-medium">
            View all logs →
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <ScrollText className="h-8 w-8 mb-2" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="mt-0.5 h-7 w-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-gray-700 break-all leading-relaxed">{log.action}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {log.admin_email}
                    {log.target_business_name && ` · ${log.target_business_name}`}
                  </p>
                </div>
                <p className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">
                  {new Date(log.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
