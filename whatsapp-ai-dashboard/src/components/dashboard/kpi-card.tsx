import {
  MessageSquare,
  Users,
  TrendingUp,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap = {
  MessageSquare,
  Users,
  TrendingUp,
  Zap,
};

type IconKey = keyof typeof iconMap;

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: string;
  description: string;
}

const iconColors: Record<IconKey, string> = {
  MessageSquare: "bg-blue-50 text-blue-600",
  Users: "bg-violet-50 text-violet-600",
  TrendingUp: "bg-emerald-50 text-emerald-600",
  Zap: "bg-amber-50 text-amber-600",
};

export function KPICard({
  title,
  value,
  change,
  changeType,
  icon,
  description,
}: KPICardProps) {
  const iconKey = icon as IconKey;
  const Icon = iconMap[iconKey] ?? MessageSquare;
  const isPositive = changeType === "positive";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        </div>
        <div className={cn("rounded-xl p-2.5", iconColors[iconKey] ?? "bg-gray-100 text-gray-600")}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
            isPositive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          )}
        >
          {isPositive ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {change}
        </span>
        <span className="text-xs text-gray-400">{description}</span>
      </div>
    </div>
  );
}
