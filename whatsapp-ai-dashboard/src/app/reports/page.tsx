'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { api } from '@/lib/api';
import { RefreshCw, MessageSquare, Users, TrendingUp, Zap, Bot } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface DashboardStats {
  totalMessages:      number;
  totalConversations: number;
  totalLeads:         number;
  hotLeads:           number;
  warmLeads:          number;
  coldLeads:          number;
  conversionRate:     number;
  ruleBasedPct:       number;
  aiFallbackPct:      number;
  messagesPerDay:     { date: string; count: number }[];
  leadsPerDay:        { date: string; leads: number }[];
}

function KpiCard({
  label, value, sub, icon: Icon, iconBg, iconColor,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <div className={`rounded-lg p-2 ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

const LEAD_COLORS = ['#ef4444', '#f59e0b', '#6b7280'];

export default function ReportsPage() {
  const [data,    setData]    = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get<DashboardStats>('/dashboard/stats')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const leadPieData = data ? [
    { name: 'Hot Leads',  value: data.hotLeads  },
    { name: 'Warm Leads', value: data.warmLeads },
    { name: 'Cold',       value: data.coldLeads },
  ] : [];

  const botPieData = data ? [
    { name: 'Rule-based', value: data.ruleBasedPct  },
    { name: 'AI Fallback', value: data.aiFallbackPct },
  ] : [];

  return (
    <MainLayout pageTitle="Reports" pageDescription="Detailed performance analytics for your business">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Business Reports</h2>
          <p className="text-sm text-gray-500 mt-0.5">Last 7 days activity overview</p>
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

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KpiCard
              label="Total Messages"
              value={(data?.totalMessages ?? 0).toLocaleString()}
              icon={MessageSquare}
              iconBg="bg-blue-50" iconColor="text-blue-600"
            />
            <KpiCard
              label="Conversations"
              value={(data?.totalConversations ?? 0).toLocaleString()}
              icon={Users}
              iconBg="bg-green-50" iconColor="text-green-600"
            />
            <KpiCard
              label="Total Leads"
              value={(data?.totalLeads ?? 0).toLocaleString()}
              sub={`${data?.hotLeads ?? 0} hot · ${data?.warmLeads ?? 0} warm`}
              icon={TrendingUp}
              iconBg="bg-amber-50" iconColor="text-amber-600"
            />
            <KpiCard
              label="Conversion Rate"
              value={`${data?.conversionRate ?? 0}%`}
              sub="conversations → leads"
              icon={Zap}
              iconBg="bg-violet-50" iconColor="text-violet-600"
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* Messages per day */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Messages per Day (Last 7 Days)</h3>
              {data && data.messagesPerDay.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={data.messagesPerDay} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#msgGrad)" name="Messages" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className="text-xs text-gray-400 py-10 text-center">No message data yet.</p>}
            </div>

            {/* Leads per day */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">New Leads per Day (Last 7 Days)</h3>
              {data && data.leadsPerDay.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.leadsPerDay} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="leads" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Leads" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-xs text-gray-400 py-10 text-center">No lead data in last 7 days.</p>}
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Lead breakdown pie */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Lead Distribution</h3>
              {leadPieData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={leadPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      labelLine={false}
                    >
                      {leadPieData.map((_, i) => (
                        <Cell key={i} fill={LEAD_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend formatter={(val) => <span className="text-xs">{val}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-xs text-gray-400 py-10 text-center">No conversations yet.</p>}
            </div>

            {/* Bot response type pie */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Bot Response Types</h3>
              <p className="text-xs text-gray-400 mb-4">Rule-based (FAQ/Services) vs AI fallback</p>
              {data && (data.ruleBasedPct > 0 || data.aiFallbackPct > 0) ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={botPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} labelLine={false}>
                        <Cell fill="#7c3aed" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip formatter={(val) => `${val}%`} />
                      <Legend formatter={(val) => <span className="text-xs">{val}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-violet-50 px-4 py-3 text-center">
                      <p className="text-xl font-bold text-violet-700">{data.ruleBasedPct}%</p>
                      <p className="text-[11px] text-violet-500 font-medium mt-0.5">Rule-based</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 px-4 py-3 text-center">
                      <p className="text-xl font-bold text-amber-700">{data.aiFallbackPct}%</p>
                      <p className="text-[11px] text-amber-500 font-medium mt-0.5">AI Fallback</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                  <Bot className="h-8 w-8 mb-2" />
                  <p className="text-xs">No bot messages yet.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
}
