import { Bot, Cpu, DollarSign, Timer, Zap, TrendingUp } from "lucide-react";

interface AiUsageData {
  totalCalls: number;
  ruleBased: number;
  aiResponses: number;
  ruleBasedPercent: number;
  aiPercent: number;
  estimatedCost: string;
  costPerCall: string;
  avgResponseTime: string;
  successRate: string;
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  iconClass: string;
  badgeText?: string;
  badgeClass?: string;
}

function StatCard({ title, value, subtitle, icon: Icon, iconClass, badgeText, badgeClass }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between mb-4">
        <div className={`rounded-xl p-2.5 ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        {badgeText && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>
            {badgeText}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      <p className="text-xs font-medium text-gray-500 mt-0.5">{title}</p>
      <p className="text-[10px] text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}

export function UsageStats({ data }: { data: AiUsageData }) {
  const { totalCalls, ruleBased, aiResponses, ruleBasedPercent, aiPercent, estimatedCost, costPerCall, avgResponseTime, successRate } = data;

  return (
    <div className="space-y-4">
      {/* Primary stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total AI Calls"
          value={totalCalls.toLocaleString()}
          subtitle="This billing period"
          icon={Bot}
          iconClass="bg-blue-50 text-blue-600"
          badgeText="Active"
          badgeClass="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Rule-Based Responses"
          value={ruleBased.toLocaleString()}
          subtitle={`${ruleBasedPercent}% of total responses`}
          icon={Cpu}
          iconClass="bg-slate-100 text-slate-600"
          badgeText={`${ruleBasedPercent}%`}
          badgeClass="bg-slate-100 text-slate-600"
        />
        <StatCard
          title="AI-Powered Responses"
          value={aiResponses.toLocaleString()}
          subtitle={`${aiPercent}% of total responses`}
          icon={Zap}
          iconClass="bg-amber-50 text-amber-600"
          badgeText={`${aiPercent}%`}
          badgeClass="bg-amber-50 text-amber-700"
        />
        <StatCard
          title="Estimated Cost"
          value={estimatedCost}
          subtitle="Projected this month"
          icon={DollarSign}
          iconClass="bg-emerald-50 text-emerald-600"
          badgeText="On track"
          badgeClass="bg-blue-50 text-blue-700"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card flex items-center gap-4">
          <div className="rounded-xl bg-violet-50 p-2.5">
            <Timer className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{avgResponseTime}</p>
            <p className="text-xs font-medium text-gray-500">Avg. Response Time</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card flex items-center gap-4">
          <div className="rounded-xl bg-emerald-50 p-2.5">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{successRate}</p>
            <p className="text-xs font-medium text-gray-500">Response Success Rate</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card flex items-center gap-4">
          <div className="rounded-xl bg-blue-50 p-2.5">
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{costPerCall}</p>
            <p className="text-xs font-medium text-gray-500">Cost per AI Call</p>
          </div>
        </div>
      </div>
    </div>
  );
}
