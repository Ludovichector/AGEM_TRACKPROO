"use client";

import { motion } from "framer-motion";
import { Calendar, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatMonth } from "@/lib/format";
import type { MilestoneCriticality, MilestoneStatus } from "@prisma/client";

const MILESTONE_CRITICALITY_COLORS: Record<MilestoneCriticality, string> = {
  LEGAL_ABSOLUTE: "var(--status-danger)",
  LEGAL: "var(--agem-gold-dark)",
  CRITICAL: "var(--status-warning)",
  KEY: "var(--agem-gold)",
  MONITORING: "var(--status-info)",
};

const MILESTONE_STATUS_VARIANT: Record<MilestoneStatus, "success" | "info" | "warning" | "danger" | "neutral"> = {
  PENDING: "neutral",
  IN_PROGRESS: "info",
  ACHIEVED: "success",
  MISSED: "danger",
};

const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  PENDING: "À venir",
  IN_PROGRESS: "En cours",
  ACHIEVED: "Atteint",
  MISSED: "Manqué",
};

const PHASE_COLORS = [
  "#C9A961", "#18181B", "#3B82F6", "#10B981", "#8B5CF6", "#AA8A2A"
];

interface Phase {
  id: string;
  number: number;
  name: string;
  startMonth: number;
  endMonth: number;
  durationMonths: number;
  description: string | null;
  progressPct: number;
  milestones: Array<{
    id: string;
    monthNumber: number;
    title: string;
    criticality: MilestoneCriticality;
    status: MilestoneStatus;
    achievedAt: string | null;
  }>;
}

interface PlanningPageClientProps {
  phases: Phase[];
  durationMonths: number;
  startDate: string;
}

export function PlanningPageClient({ phases, durationMonths, startDate }: PlanningPageClientProps) {
  const allMilestones = phases.flatMap((p) => p.milestones);
  const criticalMilestones = allMilestones.filter(
    (m) => m.criticality === "LEGAL_ABSOLUTE" || m.criticality === "CRITICAL"
  );

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Phases & Planning
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          6 phases sur {durationMonths} mois - Démarrage : {formatDate(startDate)}
        </p>
      </div>

      {/* Diagramme de Gantt simplifié */}
      <div
        className="rounded-xl border p-4"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Diagramme phases - {durationMonths} mois
        </h2>
        <div className="overflow-x-auto">
          <div style={{ minWidth: 600 }}>
            {phases.map((phase, idx) => {
              const leftPct = ((phase.startMonth - 1) / durationMonths) * 100;
              const widthPct = (phase.durationMonths / durationMonths) * 100;

              return (
                <div key={phase.id} className="flex items-center gap-3 mb-2">
                  <div className="w-5 text-xs text-right shrink-0" style={{ color: "var(--text-muted)" }}>
                    {phase.number}
                  </div>
                  <div className="flex-1 relative h-8 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)" }}>
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: `${widthPct}%`, opacity: 1 }}
                      transition={{ duration: 0.6, delay: idx * 0.1 }}
                      className="absolute top-0 bottom-0 rounded-lg flex items-center px-2"
                      style={{
                        left: `${leftPct}%`,
                        backgroundColor: `${PHASE_COLORS[idx]}22`,
                        border: `1px solid ${PHASE_COLORS[idx]}44`,
                      }}
                    >
                      <span className="text-xs font-medium truncate" style={{ color: PHASE_COLORS[idx] }}>
                        {phase.name.split(" - ")[0]}
                      </span>
                    </motion.div>

                    {/* Jalons sur la barre */}
                    {phase.milestones.map((m) => {
                      const mleftPct = ((m.monthNumber - phase.startMonth) / phase.durationMonths) * 100;
                      return (
                        <div
                          key={m.id}
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white z-10"
                          style={{
                            left: `calc(${leftPct + (mleftPct * widthPct) / 100}% - 6px)`,
                            backgroundColor: MILESTONE_CRITICALITY_COLORS[m.criticality],
                          }}
                          title={`M${m.monthNumber} - ${m.title}`}
                        />
                      );
                    })}
                  </div>
                  <div className="w-16 text-xs text-right shrink-0" style={{ color: "var(--text-muted)" }}>
                    M{phase.startMonth}–M{phase.endMonth}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Phases détaillées */}
      <div className="space-y-3">
        {phases.map((phase, idx) => (
          <div
            key={phase.id}
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div
              className="flex items-center justify-between p-4"
              style={{ backgroundColor: "var(--bg-card)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ backgroundColor: `${PHASE_COLORS[idx]}15`, color: PHASE_COLORS[idx] }}
                >
                  {phase.number}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {phase.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    M{phase.startMonth} → M{phase.endMonth} ({phase.durationMonths} mois)
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold" style={{ color: PHASE_COLORS[idx] }}>
                  {phase.progressPct.toFixed(0)}%
                </p>
                <div className="w-16 h-1.5 rounded-full mt-1" style={{ backgroundColor: "var(--border-subtle)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${phase.progressPct}%`, backgroundColor: PHASE_COLORS[idx] }}
                  />
                </div>
              </div>
            </div>

            {/* Jalons de la phase */}
            {phase.milestones.length > 0 && (
              <div className="border-t" style={{ borderColor: "var(--border-subtle)" }}>
                {phase.milestones.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 px-4 py-2.5 border-b last:border-0"
                    style={{
                      borderColor: "var(--border-subtle)",
                      borderLeft: `3px solid ${MILESTONE_CRITICALITY_COLORS[m.criticality]}`,
                    }}
                  >
                    <span
                      className="text-xs font-bold w-8 shrink-0"
                      style={{ color: MILESTONE_CRITICALITY_COLORS[m.criticality] }}
                    >
                      M{m.monthNumber}
                    </span>
                    <p className="flex-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                      {m.title}
                    </p>
                    <StatusBadge
                      label={MILESTONE_STATUS_LABELS[m.status]}
                      variant={MILESTONE_STATUS_VARIANT[m.status]}
                      dot
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
