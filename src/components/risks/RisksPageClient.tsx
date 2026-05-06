"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Shield } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format";
import { updateRiskStatus } from "@/app/(dashboard)/risks/actions";
import { toast } from "sonner";
import type { RiskStatus } from "@prisma/client";

const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  UNDER_CONTROL: "Sous contrôle",
  MONITORING: "Surveillance",
  ESCALATED: "Escalade",
  CLOSED: "Clôturé",
};

const RISK_STATUS_VARIANT: Record<RiskStatus, "success" | "info" | "warning" | "danger" | "neutral"> = {
  UNDER_CONTROL: "success",
  MONITORING: "warning",
  ESCALATED: "danger",
  CLOSED: "neutral",
};

function getScoreColor(score: number): string {
  if (score >= 6) return "var(--status-danger)";
  if (score >= 3) return "var(--status-warning)";
  return "var(--status-success)";
}

function getScoreLabel(score: number): string {
  if (score >= 6) return "Critique";
  if (score >= 3) return "Modéré";
  return "Faible";
}

interface Risk {
  id: string;
  title: string;
  probability: number;
  impact: number;
  score: number;
  mitigation: string;
  status: RiskStatus;
  ownerId: string | null;
  createdAt: string;
  updates: Array<{
    id: string;
    comment: string;
    newStatus: RiskStatus | null;
    authorName: string;
    createdAt: string;
  }>;
}

interface RisksPageClientProps {
  risks: Risk[];
  canEdit: boolean;
  canApprove: boolean;
  projectId: string;
  userId: string;
}

export function RisksPageClient({ risks, canEdit, canApprove }: RisksPageClientProps) {
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "matrix">("list");

  const criticalCount = risks.filter((r) => r.score >= 6 && r.status !== "CLOSED").length;
  const activeCount = risks.filter((r) => r.status !== "CLOSED").length;

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Registre des Risques
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {activeCount} risques actifs - {criticalCount} critiques (score ≥ 6)
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: "var(--bg-elevated)" }}>
        {(["list", "matrix"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: activeTab === tab ? "var(--bg-card)" : "transparent",
              color: activeTab === tab ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {tab === "list" ? "Registre" : "Matrice 3×3"}
          </button>
        ))}
      </div>

      {/* Liste des risques */}
      {activeTab === "list" && (
        <div className="space-y-2">
          {risks.map((risk) => (
            <motion.div
              key={risk.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedRisk(risk === selectedRisk ? null : risk)}
              className="rounded-xl border cursor-pointer hover:shadow-sm transition-all"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: risk.score >= 6 ? "rgba(239,68,68,0.2)" : "var(--border-subtle)",
              }}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                    style={{
                      backgroundColor: `${getScoreColor(risk.score)}15`,
                      color: getScoreColor(risk.score),
                    }}
                  >
                    {risk.score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {risk.title}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge
                          label={getScoreLabel(risk.score)}
                          variant={risk.score >= 6 ? "danger" : risk.score >= 3 ? "warning" : "success"}
                        />
                        {canApprove ? (
                          <select
                            value={risk.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={async (e) => {
                              const newStatus = e.target.value as RiskStatus;
                              const res = await updateRiskStatus({
                                riskId: risk.id,
                                status: newStatus
                              });
                              if (res.success) toast.success("Statut du risque mis à jour");
                              else toast.error(res.error || "Erreur lors de la mise à jour");
                            }}
                            className="text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--agem-gold)] cursor-pointer transition-all hover:bg-[var(--bg-card)]"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {Object.entries(RISK_STATUS_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        ) : (
                          <StatusBadge
                            label={RISK_STATUS_LABELS[risk.status]}
                            variant={RISK_STATUS_VARIANT[risk.status]}
                            dot
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        P:{risk.probability} × I:{risk.impact} = {risk.score}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedRisk?.id === risk.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 pt-3 border-t"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                      Mesure de maîtrise
                    </p>
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                      {risk.mitigation}
                    </p>
                    {risk.updates.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                          Mises à jour récentes
                        </p>
                        <div className="space-y-1.5">
                          {risk.updates.slice(0, 2).map((u) => (
                            <div key={u.id} className="text-xs" style={{ color: "var(--text-muted)" }}>
                              <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
                                {u.authorName}
                              </span>
                              {" - "}{formatDate(u.createdAt)}{" - "}{u.comment}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Matrice 3×3 */}
      {activeTab === "matrix" && (
        <div
          className="rounded-xl border p-5"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Matrice Probabilité × Impact
          </h3>
          <div className="flex gap-2">
            <div className="flex flex-col-reverse gap-2">
              {[3, 2, 1].map((p) => (
                <div key={p} className="h-20 w-8 flex items-center justify-center">
                  <span className="text-xs -rotate-90 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                    P={p}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-3 gap-2">
                {[3, 2, 1].map((p) =>
                  [1, 2, 3].map((i) => {
                    const score = p * i;
                    const cellRisks = risks.filter(
                      (r) => r.probability === p && r.impact === i && r.status !== "CLOSED"
                    );
                    return (
                      <div
                        key={`${p}-${i}`}
                        className="h-20 rounded-xl p-2 flex flex-col justify-between"
                        style={{
                          backgroundColor:
                            score >= 6 ? "rgba(239,68,68,0.1)" :
                              score >= 3 ? "rgba(245,158,11,0.1)" :
                                "rgba(16,185,129,0.1)",
                          border: `1px solid ${score >= 6 ? "rgba(239,68,68,0.2)" : score >= 3 ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)"}`,
                        }}
                      >
                        <span
                          className="text-xs font-bold"
                          style={{ color: getScoreColor(score) }}
                        >
                          {score}
                        </span>
                        <div className="flex flex-wrap gap-0.5">
                          {cellRisks.map((r) => (
                            <div
                              key={r.id}
                              className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white"
                              style={{ backgroundColor: getScoreColor(score) }}
                              title={r.title}
                            >
                              {r.id.slice(-1)}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="flex justify-around mt-2">
                {[1, 2, 3].map((i) => (
                  <span key={i} className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                    I={i}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "rgba(16,185,129,0.3)" }} />Faible (1–2)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "rgba(245,158,11,0.3)" }} />Modéré (3–4)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "rgba(239,68,68,0.3)" }} />Critique (6–9)</span>
          </div>
        </div>
      )}
    </div>
  );
}
