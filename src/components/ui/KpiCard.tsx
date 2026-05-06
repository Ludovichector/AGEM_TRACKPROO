"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: string | ReactNode;
  subtitle?: string;
  trend?: { value: number; label?: string };
  statusColor?: string;
  icon?: ReactNode;
  alert?: boolean;
  className?: string;
  onClick?: () => void;
}

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  statusColor,
  icon,
  alert,
  className,
  onClick,
}: KpiCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 transition-shadow hover:shadow-md",
        alert && "ring-2",
        onClick && "cursor-pointer",
        className
      )}
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: alert ? "var(--status-danger)" : "var(--border-subtle)",
        // @ts-ignore
        "--tw-ring-color": alert ? "rgba(239,68,68,0.2)" : undefined,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          {title}
        </p>
        {icon && (
          <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: statusColor ? `${statusColor}18` : "var(--bg-elevated)" }}>
            <span style={{ color: statusColor ?? "var(--text-secondary)" }}>{icon}</span>
          </div>
        )}
      </div>

      <div className="text-2xl font-bold mb-1" style={{ color: statusColor ?? "var(--text-primary)" }}>
        {value}
      </div>

      <div className="flex items-center justify-between">
        {subtitle && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
        {trend && (
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded-md"
            style={{
              backgroundColor: trend.value >= 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              color: trend.value >= 0 ? "var(--status-success)" : "var(--status-danger)",
            }}
          >
            {trend.value >= 0 ? "+" : ""}{trend.value.toFixed(2)}{trend.label ?? ""}
          </span>
        )}
      </div>
    </motion.div>
  );
}
