import { cn } from "@/lib/utils";

type Variant = "success" | "warning" | "danger" | "info" | "neutral" | "gold";

const VARIANT_STYLES: Record<Variant, { bg: string; text: string }> = {
  success: { bg: "rgba(16,185,129,0.1)", text: "var(--status-success)" },
  warning: { bg: "rgba(201,169,97,0.1)", text: "var(--status-warning)" },
  danger: { bg: "rgba(239,68,68,0.1)", text: "var(--status-danger)" },
  info: { bg: "rgba(59,130,246,0.1)", text: "var(--status-info)" },
  neutral: { bg: "rgba(107,114,128,0.1)", text: "var(--status-neutral)" },
  gold: { bg: "rgba(201,169,97,0.1)", text: "var(--agem-gold)" },
};

interface StatusBadgeProps {
  label: string;
  variant?: Variant;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({ label, variant = "neutral", dot, className }: StatusBadgeProps) {
  const { bg, text } = VARIANT_STYLES[variant];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium", className)}
      style={{ backgroundColor: bg, color: text }}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: text }} />}
      {label}
    </span>
  );
}
