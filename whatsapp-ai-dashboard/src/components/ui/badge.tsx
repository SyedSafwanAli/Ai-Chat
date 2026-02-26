import { cn } from "@/lib/utils";

type BadgeVariant = "hot" | "warm" | "cold" | "default" | "success" | "warning";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  hot: "bg-rose-50 text-rose-700 border border-rose-200",
  warm: "bg-amber-50 text-amber-700 border border-amber-200",
  cold: "bg-slate-100 text-slate-600 border border-slate-200",
  default: "bg-blue-50 text-blue-700 border border-blue-200",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-orange-50 text-orange-700 border border-orange-200",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function LeadStatusBadge({ status }: { status: "Hot" | "Warm" | "Cold" }) {
  const dots: Record<string, string> = {
    Hot: "bg-rose-500",
    Warm: "bg-amber-500",
    Cold: "bg-slate-400",
  };
  const variants: Record<string, BadgeVariant> = {
    Hot: "hot",
    Warm: "warm",
    Cold: "cold",
  };
  return (
    <Badge variant={variants[status]}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[status])} />
      {status}
    </Badge>
  );
}
