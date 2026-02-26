"use client";

import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";

interface DataPoint { date: string; messages: number; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-gray-900">
          {payload[0].value.toLocaleString()}{" "}
          <span className="text-xs font-normal text-gray-400">messages</span>
        </p>
      </div>
    );
  }
  return null;
};

export function MessagesChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Messages per Day</h3>
          <p className="text-xs text-gray-400 mt-0.5">Last 7 days activity</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-xs font-medium text-gray-600">Messages</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="messagesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 2 }} />
          <Area
            type="monotone"
            dataKey="messages"
            stroke="#2563eb"
            strokeWidth={2.5}
            fill="url(#messagesGradient)"
            dot={false}
            activeDot={{ r: 5, fill: "#2563eb", stroke: "white", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
