'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Building2, CheckCircle2, Coins, RefreshCw, BarChart3, Trophy } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area, ResponsiveContainer, Legend,
} from 'recharts';

interface AnalyticsData {
  pkgBreakdown:    { package: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  creditsByMonth:  { month: string; total: number }[];
  newBizByMonth:   { month: string; count: number }[];
  topCredits:      { business_name: string; credits_used: number }[];
}

const PKG_COLORS:    Record<string, string> = { trial: '#f59e0b', basic: '#3b82f6', pro: '#7c3aed', none: '#9ca3af' };
const STATUS_COLORS: Record<string, string> = { active: '#10b981', pending: '#f59e0b', suspended: '#ef4444' };

function StatCard({ label, value, icon: Icon, iconColor, iconBg, sub }: { label: string; value: string | number; icon: React.ElementType; iconColor: string; iconBg: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <div className={`rounded-lg p-2 ${iconBg}`}><Icon className={`h-4 w-4 ${iconColor}`} /></div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: {cx:number; cy:number; midAngle:number; innerRadius:number; outerRadius:number; percent:number; name:string}) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
      {name}
    </text>
  );
};

export default function AnalyticsPage() {
  const { user }  = useAuth();
  const router    = useRouter();
  const [data,    setData]    = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'super_admin') { router.replace('/'); return; }
  }, [user, router]);

  const load = () => {
    setLoading(true);
    api.get<AnalyticsData>('/super-admin/analytics')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const totalBiz    = data?.pkgBreakdown.reduce((s, r) => s + Number(r.count), 0) ?? 0;
  const activeBiz   = data?.statusBreakdown.find(r => r.status === 'active')?.count ?? 0;
  const totalCredits = data?.creditsByMonth.reduce((s, r) => s + Number(r.total), 0) ?? 0;
  const topUser     = data?.topCredits[0];

  return (
    <MainLayout pageTitle="Analytics" pageDescription="Platform-wide insights and charts">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Platform Analytics</h2>
          <p className="text-sm text-gray-500 mt-0.5">Real-time platform-wide insights</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      ) : (
        <>
          {/* KPI Mini-Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Businesses" value={totalBiz} icon={Building2} iconColor="text-blue-600" iconBg="bg-blue-50" />
            <StatCard label="Active Now" value={activeBiz} icon={CheckCircle2} iconColor="text-green-600" iconBg="bg-green-50" sub={`${totalBiz ? Math.round((activeBiz / totalBiz) * 100) : 0}% of total`} />
            <StatCard label="Credits Issued" value={totalCredits.toLocaleString()} icon={Coins} iconColor="text-violet-600" iconBg="bg-violet-50" sub="last 6 months" />
            <StatCard label="Top User" value={topUser ? topUser.business_name : '—'} icon={Trophy} iconColor="text-amber-600" iconBg="bg-amber-50" sub={topUser ? `${Number(topUser.credits_used).toLocaleString()} credits used` : ''} />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* Package Breakdown */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Package Distribution</h3>
              {data && data.pkgBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.pkgBreakdown} dataKey="count" nameKey="package" cx="50%" cy="50%" outerRadius={90} labelLine={false} label={CustomPieLabel}>
                      {data.pkgBreakdown.map((entry) => (
                        <Cell key={entry.package} fill={PKG_COLORS[entry.package] ?? '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val, name) => [val, name]} />
                    <Legend formatter={(val) => <span className="text-xs capitalize">{val}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-xs text-gray-400 py-10 text-center">No data yet.</p>}
            </div>

            {/* Status Breakdown */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Business Status</h3>
              {data && data.statusBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.statusBreakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={90} labelLine={false} label={CustomPieLabel}>
                      {data.statusBreakdown.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val, name) => [val, name]} />
                    <Legend formatter={(val) => <span className="text-xs capitalize">{val}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-xs text-gray-400 py-10 text-center">No data yet.</p>}
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* New Businesses per Month */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">New Businesses (Last 6 Months)</h3>
              {data && data.newBizByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.newBizByMonth} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} name="New Businesses" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-xs text-gray-400 py-10 text-center">No data in last 6 months.</p>}
            </div>

            {/* Credits Issued per Month */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Credits Issued (Last 6 Months)</h3>
              {data && data.creditsByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={data.creditsByMonth} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="credGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fill="url(#credGrad)" name="Credits Issued" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className="text-xs text-gray-400 py-10 text-center">No credit transactions yet.</p>}
            </div>
          </div>

          {/* Top 5 Credit Users */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-gray-900">Top 5 Credit Users</h3>
            </div>
            {data && data.topCredits.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {data.topCredits.map((biz, idx) => {
                  const max = data.topCredits[0].credits_used || 1;
                  const pct = Math.round((Number(biz.credits_used) / Number(max)) * 100);
                  return (
                    <div key={biz.business_name} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${
                        idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-100 text-gray-700' : 'bg-orange-50 text-orange-700'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{biz.business_name}</p>
                          <p className="text-xs font-semibold text-gray-600 flex-shrink-0 ml-3">{Number(biz.credits_used).toLocaleString()}</p>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                <BarChart3 className="h-8 w-8 mb-2" />
                <p className="text-xs">No credit usage data yet.</p>
              </div>
            )}
          </div>
        </>
      )}
    </MainLayout>
  );
}
