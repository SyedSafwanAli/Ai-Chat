'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { UsageStats } from '@/components/ai-usage/usage-stats';
import { UsagePieChart, CostEstimationCard } from '@/components/ai-usage/usage-pie-chart';
import { api } from '@/lib/api';

interface DashboardStats {
  totalMessages: number;
  ruleBasedPct: number;
  aiFallbackPct: number;
  messagesPerDay: { date: string; messages: number }[];
}

export default function AIUsagePage() {
  const [stats,   setStats]   = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardStats>('/dashboard/stats')
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Build derived UI data from API stats
  const totalMessages   = stats?.totalMessages   ?? 0;
  const ruleBasedPct    = stats?.ruleBasedPct    ?? 0;
  const aiFallbackPct   = stats?.aiFallbackPct   ?? 0;
  const ruleBased       = Math.round((ruleBasedPct  / 100) * totalMessages);
  const aiResponses     = Math.round((aiFallbackPct / 100) * totalMessages);

  const usageData = {
    totalCalls:       totalMessages,
    ruleBased,
    aiResponses,
    ruleBasedPercent: ruleBasedPct,
    aiPercent:        aiFallbackPct,
    estimatedCost:    '—',     // no external AI API in this system
    costPerCall:      '$0.000',
    avgResponseTime:  '< 1s',
    successRate:      '99.9%',
  };

  const pieData = [
    { name: 'Rule-Based', value: ruleBasedPct,  color: '#64748b' },
    { name: 'Fallback',   value: aiFallbackPct, color: '#2563eb' },
  ];

  // Estimate daily ai/rule split from messages-per-day using overall %
  const dailyData = (stats?.messagesPerDay ?? []).map((d: { date: string; messages: number }) => {
    const total = d.messages;
    return {
      date: d.date,
      ai:   Math.round((aiFallbackPct / 100) * total),
      rule: Math.round((ruleBasedPct  / 100) * total),
    };
  });

  return (
    <MainLayout pageTitle="AI Usage" pageDescription="Monitor response volume, types, and performance">
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="mb-5">
            <UsageStats data={usageData} />
          </div>

          <div className="mb-5">
            <UsagePieChart pieData={pieData} dailyData={dailyData} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CostEstimationCard />
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">AI Model Configuration</h3>
              <div className="space-y-4">
                {[
                  { label: 'Mode',      value: 'Rule-Based',   className: 'bg-blue-50 text-blue-700' },
                  { label: 'Rules',     value: '7 patterns',   className: '' },
                  { label: 'FAQ Match', value: 'Word-overlap', className: '' },
                  { label: 'Lead Detect', value: 'Keyword list', className: '' },
                  { label: 'Fallback',  value: 'Human handoff', className: 'bg-emerald-50 text-emerald-700' },
                ].map(({ label, value, className }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className={`text-xs font-semibold text-gray-700 ${className ? `px-2 py-0.5 rounded-full ${className}` : ''}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <button className="mt-5 w-full rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Edit Configuration
              </button>
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
}
