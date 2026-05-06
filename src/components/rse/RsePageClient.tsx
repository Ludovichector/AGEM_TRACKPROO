"use client";

import { motion } from "framer-motion";
import { Leaf, Users, Recycle, Award, TrendingUp, Minus } from "lucide-react";

interface RseEntry {
  id: string;
  monthNumber: number;
  carbonTotalTCO2eq: number | null;
  carbonMonthlyTCO2eq: number | null;
  reductionVsBenchmarkPct: number | null;
  localMaterialsPct: number | null;
  localWorkforcePct: number | null;
  wasteValorizationPct: number | null;
}

interface RseCertification {
  id: string;
  name: string;
  status: string;
  progressPct: number;
  targetLevel: string;
  selectionPhase: string;
  auditor: string | null;
}

interface RsePageClientProps {
  entries: RseEntry[];
  certifications: RseCertification[];
}

const CERT_STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planifiée",
  IN_PROGRESS: "En cours",
  OBTAINED: "Obtenue",
  EXPIRED: "Expirée",
};

const CERT_STATUS_COLORS: Record<string, string> = {
  PLANNED: "var(--text-muted)",
  IN_PROGRESS: "var(--status-info)",
  OBTAINED: "var(--status-success)",
  EXPIRED: "var(--status-danger)",
};

function KpiTile({
  label,
  value,
  unit,
  target,
  color,
  idx,
}: {
  label: string;
  value: number | null;
  unit: string;
  target: number;
  color: string;
  idx: number;
}) {
  const pct = value != null ? Math.min(100, (value / target) * 100) : 0;
  const onTarget = pct >= 90;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06 }}
      className="rounded-xl border p-4"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
    >
      <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <div className="flex items-end gap-1 mb-1">
        <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {value != null ? value.toFixed(1) : "-"}
        </span>
        <span className="text-sm mb-0.5" style={{ color: "var(--text-muted)" }}>
          {unit}
        </span>
      </div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          Objectif : {target} {unit}
        </span>
        <span
          className="text-xs font-medium"
          style={{ color: onTarget ? "var(--status-success)" : color }}
        >
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--border-subtle)" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: onTarget ? "var(--status-success)" : color,
          }}
        />
      </div>
    </motion.div>
  );
}

export function RsePageClient({ entries, certifications }: RsePageClientProps) {
  // Aggregate latest values
  const latest = entries[entries.length - 1] ?? null;
  const totalCarbon = entries.reduce((s, e) => s + (e.carbonMonthlyTCO2eq ?? 0), 0);
  const avgLocalMaterials = entries.length
    ? entries.reduce((s, e) => s + (e.localMaterialsPct ?? 0), 0) / entries.length
    : null;
  const avgLocalWorkforce = entries.length
    ? entries.reduce((s, e) => s + (e.localWorkforcePct ?? 0), 0) / entries.length
    : null;
  const avgWaste = entries.length
    ? entries.reduce((s, e) => s + (e.wasteValorizationPct ?? 0), 0) / entries.length
    : null;

  const kpis = [
    {
      label: "Carbone total cumulé",
      value: totalCarbon || null,
      unit: "tCO₂eq",
      target: 500,
      color: "var(--status-warning)",
    },
    {
      label: "Réduction vs benchmark",
      value: latest?.reductionVsBenchmarkPct ?? null,
      unit: "%",
      target: 20,
      color: "var(--status-success)",
    },
    {
      label: "Matériaux locaux (moy.)",
      value: avgLocalMaterials,
      unit: "%",
      target: 30,
      color: "var(--status-info)",
    },
    {
      label: "Main-d'œuvre locale (moy.)",
      value: avgLocalWorkforce,
      unit: "%",
      target: 40,
      color: "#8B5CF6",
    },
    {
      label: "Valorisation déchets (moy.)",
      value: avgWaste,
      unit: "%",
      target: 70,
      color: "var(--agem-gold)",
    },
    {
      label: "Mois de données RSE",
      value: entries.length || null,
      unit: "mois",
      target: 67,
      color: "var(--text-muted)",
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          RSE - Responsabilité Sociétale
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Indicateurs de performance extra-financière - OBF-SIEGE-2026
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {kpis.map((kpi, i) => (
          <KpiTile key={kpi.label} {...kpi} idx={i} />
        ))}
      </div>

      {/* Monthly trend table */}
      {entries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div
            className="px-5 py-3.5 flex items-center gap-3"
            style={{ backgroundColor: "var(--bg-elevated)" }}
          >
            <Leaf className="w-4 h-4" style={{ color: "var(--status-success)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Suivi mensuel RSE
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--bg-elevated)" }}>
                  {["Mois", "Carbone mois (tCO₂)", "Carbone total", "Réd. benchmark", "Mat. locaux", "MO locale", "Val. déchets"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-xs font-semibold"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.slice(-12).map((entry, i) => (
                  <tr
                    key={entry.id}
                    className="border-t"
                    style={{
                      borderColor: "var(--border-subtle)",
                      backgroundColor: i % 2 === 0 ? "var(--bg-card)" : "var(--bg-elevated)",
                    }}
                  >
                    <td className="px-4 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>
                      M{entry.monthNumber}
                    </td>
                    {[
                      entry.carbonMonthlyTCO2eq,
                      entry.carbonTotalTCO2eq,
                      entry.reductionVsBenchmarkPct,
                      entry.localMaterialsPct,
                      entry.localWorkforcePct,
                      entry.wasteValorizationPct,
                    ].map((v, j) => (
                      <td key={j} className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
                        {v != null ? `${v.toFixed(1)}${j >= 2 ? "%" : ""}` : "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div
            className="flex items-center gap-3 px-5 py-3.5"
            style={{ backgroundColor: "var(--bg-elevated)" }}
          >
            <Award className="w-4 h-4" style={{ color: "var(--agem-gold)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Certifications & Labels
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="px-5 py-4 flex items-center gap-4"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {cert.name}
                    </p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "rgba(201,169,97,0.1)", color: "var(--agem-gold-dark)" }}
                    >
                      {cert.targetLevel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Phase {cert.selectionPhase}
                    </span>
                    {cert.auditor && (
                      <>
                        <span style={{ color: "var(--text-muted)" }}>·</span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {cert.auditor}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="flex-1 h-1.5 rounded-full max-w-xs"
                      style={{ backgroundColor: "var(--border-subtle)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${cert.progressPct}%`,
                          backgroundColor: CERT_STATUS_COLORS[cert.status] ?? "var(--status-info)",
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                      {cert.progressPct}%
                    </span>
                  </div>
                </div>
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                  style={{
                    color: CERT_STATUS_COLORS[cert.status] ?? "var(--text-muted)",
                    backgroundColor: `${CERT_STATUS_COLORS[cert.status] ?? "var(--text-muted)"}15`,
                  }}
                >
                  {CERT_STATUS_LABELS[cert.status] ?? cert.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
