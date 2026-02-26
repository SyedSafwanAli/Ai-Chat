"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
interface PieEntry  { name: string; value: number; color: string; }
interface DailyEntry { date: string; ai: number; rule: number; }

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
        <p className="text-xs font-semibold text-gray-900">{payload[0].name}</p>
        <p className="text-sm font-bold mt-0.5" style={{ color: payload[0].payload.color }}>
          {payload[0].value}%
        </p>
      </div>
    );
  }
  return null;
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg min-w-[140px]">
        <p className="text-xs font-medium text-gray-500 mb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
              <span className="text-xs text-gray-600">{p.name}</span>
            </div>
            <span className="text-xs font-bold text-gray-900">{p.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function UsagePieChart({
  pieData,
  dailyData,
}: {
  pieData: PieEntry[];
  dailyData: DailyEntry[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* Pie chart */}
      <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Response Distribution</h3>
          <p className="text-xs text-gray-400 mt-0.5">AI vs Rule-Based breakdown</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={90}
              innerRadius={44}
              dataKey="value"
              strokeWidth={3}
              stroke="white"
            >
              {pieData.map((entry: PieEntry, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 space-y-2">
          {pieData.map((entry: PieEntry) => (
            <div key={entry.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
                <span className="text-xs text-gray-600">{entry.name}</span>
              </div>
              <span className="text-xs font-semibold text-gray-900">{entry.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily stacked bar chart */}
      <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Daily AI vs Rule-Based</h3>
            <p className="text-xs text-gray-400 mt-0.5">Last 7 days breakdown</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-blue-600" />
              <span className="text-xs text-gray-500">AI</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-slate-400" />
              <span className="text-xs text-gray-500">Rule</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={22}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#f8fafc" }} />
            <Bar dataKey="ai" name="AI" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
            <Bar dataKey="rule" name="Rule" stackId="a" fill="#94a3b8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CostEstimationCard() {
  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white shadow-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold">Cost Estimation</h3>
          <p className="text-xs text-blue-200 mt-0.5">February 2024 billing cycle</p>
        </div>
        <div className="rounded-xl bg-white/15 px-3 py-1.5">
          <span className="text-xs font-semibold">Pro Plan</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="rounded-xl bg-white/10 p-4">
          <p className="text-2xl font-bold">$36.86</p>
          <p className="text-xs text-blue-200 mt-0.5">Projected this month</p>
        </div>
        <div className="rounded-xl bg-white/10 p-4">
          <p className="text-2xl font-bold">$50.00</p>
          <p className="text-xs text-blue-200 mt-0.5">Monthly plan limit</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-blue-200">Budget usage</span>
          <span className="text-xs font-semibold">73.7%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/20">
          <div className="h-2 rounded-full bg-white" style={{ width: "73.7%" }} />
        </div>
        <p className="text-[10px] text-blue-200">$13.14 remaining of your $50 monthly limit</p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/20 pt-4">
        {[
          { label: "AI Calls", value: "18,432" },
          { label: "Per Call", value: "$0.002" },
          { label: "Avg/Day", value: "$1.32" },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-sm font-bold">{item.value}</p>
            <p className="text-[10px] text-blue-200">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
