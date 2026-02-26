'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { KPICard } from '@/components/dashboard/kpi-card';
import { MessagesChart } from '@/components/dashboard/messages-chart';
import { LeadsChart } from '@/components/dashboard/leads-chart';
import { ConversationsTable } from '@/components/dashboard/conversations-table';
import { HotLeadsPanel } from '@/components/dashboard/hot-leads-panel';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Conversation, HotLead } from '@/lib/types';

interface DashboardStats {
  totalMessages: number;
  totalConversations: number;
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  conversionRate: number;
  ruleBasedPct: number;
  aiFallbackPct: number;
  messagesPerDay: { date: string; messages: number }[];
  leadsPerDay: { date: string; leads: number }[];
}

function buildKpiCards(stats: DashboardStats) {
  return [
    {
      title: 'Total Messages',
      value: stats.totalMessages.toLocaleString(),
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: 'MessageSquare',
      description: 'all time',
    },
    {
      title: 'Total Leads',
      value: stats.totalLeads.toLocaleString(),
      change: '+8.3%',
      changeType: 'positive' as const,
      icon: 'Users',
      description: 'hot + warm',
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      change: '-2.1%',
      changeType: 'negative' as const,
      icon: 'TrendingUp',
      description: 'leads / conversations',
    },
    {
      title: 'Rule-Based',
      value: `${stats.ruleBasedPct}%`,
      change: '+5.4%',
      changeType: 'positive' as const,
      icon: 'Zap',
      description: 'of bot responses',
    },
  ];
}

// Map API conversation rows to the shape ConversationsTable expects
function mapConversation(row: Record<string, unknown>): Conversation {
  const name = (row.customer_name as string) || 'Unknown';
  const words = name.trim().split(' ');
  const initials = words.length >= 2
    ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  const status = (row.lead_status as string) ?? 'cold';
  return {
    id: row.id as number,
    customerName: name,
    initials,
    lastMessage: (row.last_message as string) || '',
    platform: (row.platform as string) || 'WhatsApp',
    leadStatus: (status.charAt(0).toUpperCase() + status.slice(1)) as 'Hot' | 'Warm' | 'Cold',
    time: row.last_message_at
      ? new Date(row.last_message_at as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '',
    phone: (row.customer_phone as string) || '',
  };
}

// Map API hot lead rows to the HotLead shape
function mapHotLead(row: Record<string, unknown>): HotLead {
  const name = (row.customer_name as string) || 'Unknown';
  const words = name.trim().split(' ');
  const initials = words.length >= 2
    ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  return {
    id: row.id as number,
    name,
    initials,
    budget: '',
    service: '',
    lastMessage: (row.last_message as string) || (row.last_customer_message as string) || '',
    contacted: Boolean(row.is_contacted),
    time: row.last_message_at
      ? new Date(row.last_message_at as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '',
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats,     setStats]     = useState<DashboardStats | null>(null);
  const [convRows,  setConvRows]  = useState<Conversation[]>([]);
  const [hotLeadRows, setHotLeadRows] = useState<HotLead[]>([]);
  const [loading,   setLoading]   = useState(true);

  const businessName = user?.role === 'super_admin'
    ? 'Super Admin'
    : user?.business_name || user?.email?.split('@')[0] || 'Business';

  useEffect(() => {
    Promise.allSettled([
      api.get<DashboardStats>('/dashboard/stats'),
      api.get<{ conversations: Record<string, unknown>[] }>('/conversations?limit=20'),
      api.get<{ leads?: Record<string, unknown>[]; conversations?: Record<string, unknown>[] }>('/leads?limit=5'),
    ]).then(([statsRes, convRes, leadsRes]) => {
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (convRes.status === 'fulfilled') setConvRows(convRes.value.conversations.map(mapConversation));
      if (leadsRes.status === 'fulfilled') {
        const d = leadsRes.value;
        setHotLeadRows((d.leads ?? d.conversations ?? []).slice(0, 5).map(mapHotLead));
      }
    }).finally(() => setLoading(false));
  }, []);

  const kpis        = buildKpiCards(stats ?? { totalMessages: 0, totalConversations: 0, totalLeads: 0, hotLeads: 0, warmLeads: 0, coldLeads: 0, conversionRate: 0, ruleBasedPct: 0, aiFallbackPct: 0, messagesPerDay: [], leadsPerDay: [] });
  const msgPerDay   = stats?.messagesPerDay  ?? [];
  const leadsPerDay = stats?.leadsPerDay     ?? [];

  return (
    <MainLayout pageTitle="Dashboard" pageDescription={`Welcome, ${businessName}`}>
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-5">
        {kpis.map((kpi: ReturnType<typeof buildKpiCards>[number]) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Charts + Hot Leads */}
      <div className="grid gap-4 lg:grid-cols-3 mb-5">
        <div className="lg:col-span-2 space-y-4">
          <MessagesChart data={msgPerDay} />
          <LeadsChart data={leadsPerDay} />
        </div>
        <div className="lg:col-span-1">
          <HotLeadsPanel hotLeads={hotLeadRows} />
        </div>
      </div>

      {/* Conversations Table */}
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-card">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-400">Loading conversations…</p>
        </div>
      ) : (
        <ConversationsTable conversations={convRows} />
      )}
    </MainLayout>
  );
}
