"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, CheckCircle, Clock, AlertTriangle, ChevronDown } from "lucide-react";
import { formatXOF, formatPct, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { updateLegalActionStatus, updateFiscalAdvantage } from "@/app/(dashboard)/legal/actions";
import { toast } from "sonner";
import type { LegalActionStatus, EligibilityStatus } from "@prisma/client";
import type { LegalAlertLevel } from "@/lib/legal";

const ACTION_STATUS_LABELS: Record<LegalActionStatus, string> = {
  TO_START: "À démarrer",
  IN_PROGRESS: "En cours",
  ON_HOLD: "En attente",
  COMPLETED: "Terminé",
  BLOCKED: "Bloqué",
  LEGAL_MILESTONE_PENDING: "Jalon légal",
};

const ACTION_STATUS_VARIANT: Record<LegalActionStatus, "success" | "info" | "warning" | "danger" | "neutral" | "gold"> = {
  TO_START: "neutral",
  IN_PROGRESS: "info",
  ON_HOLD: "warning",
  COMPLETED: "success",
  BLOCKED: "danger",
  LEGAL_MILESTONE_PENDING: "gold",
};

const ELIGIBILITY_LABELS: Record<EligibilityStatus, string> = {
  YES: "Éligible",
  NO: "Non éligible",
  TO_VERIFY: "À vérifier",
};

interface LegalPageClientProps {
  legalCountdown: {
    daysRemaining: number;
    totalLegalDays: number;
    progressionPct: number;
    alertLevel: LegalAlertLevel;
    alertLabel: string;
    alertColor: string;
    deadline: string;
  };
  construction36: {
    isStarted: boolean;
    monthsElapsed: number;
    monthsRemaining: number;
    constructionProgressVsTimePct: number;
    deadlineDate: string | null;
    startDate: string | null;
  };
  legalTracker: {
    dossierCompletenessPct: number;
    authorizationsObtained: number;
    authorizationsRequired: number;
    fiscalDossiersDeposited: number;
    fiscalDossiersTotal: number;
  } | null;
  legalActions: Array<{
    id: string;
    title: string;
    phase: string;
    deadline: string;
    responsible: string;
    status: LegalActionStatus;
    notes: string | null;
    position: number;
  }>;
  fiscalAdvantages: Array<{
    id: string;
    category: string;
    eligible: EligibilityStatus;
    dossierStatus: string;
    agrementStatus: string;
    estimatedSavingsXOF: string;
  }>;
  canEdit: boolean;
  canApprove: boolean;
  projectId: string;
}

export function LegalPageClient({
  legalCountdown,
  construction36,
  legalTracker,
  legalActions,
  fiscalAdvantages,
  canEdit,
  canApprove,
}: LegalPageClientProps) {
  const [activeTab, setActiveTab] = useState<"matrice" | "fiscal" | "documents">("matrice");

  const totalSavings = fiscalAdvantages.reduce(
    (sum, f) => sum + BigInt(f.estimatedSavingsXOF), 0n
  );

  const phases = [...new Set(legalActions.map((a) => a.phase))];

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Tracker Loi 022-2025
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loi N° 022-2025/ALT du 29 décembre 2025 - Suivi conformité réglementaire
        </p>
      </div>

      {/* Compteurs géants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Délai de dépôt */}
        <div
          className="rounded-2xl border p-6"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: legalCountdown.alertLevel !== "NORMAL" ? legalCountdown.alertColor + "40" : "var(--border-subtle)",
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Délai légal de dépôt
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Date limite : 30/06/2026
              </p>
            </div>
            <StatusBadge
              label={legalCountdown.alertLabel}
              variant={
                legalCountdown.alertLevel === "NORMAL" ? "success" :
                  legalCountdown.alertLevel === "SURVEILLANCE" ? "warning" :
                    legalCountdown.alertLevel === "ALERT_ORANGE" ? "warning" : "danger"
              }
              dot
            />
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-6xl font-bold mb-2"
            style={{ color: legalCountdown.alertColor }}
          >
            {legalCountdown.daysRemaining <= 0 ? "DÉPASSÉ" : legalCountdown.daysRemaining}
          </motion.div>
          <p className="text-lg font-medium mb-4" style={{ color: "var(--text-secondary)" }}>
            {legalCountdown.daysRemaining > 0 ? "jours restants" : "délai légal dépassé"}
          </p>

          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-elevated)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${legalCountdown.progressionPct}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full rounded-full"
              style={{ backgroundColor: legalCountdown.alertColor }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            <span>29/12/2025</span>
            <span>{formatPct(legalCountdown.progressionPct)} écoulé</span>
            <span>30/06/2026</span>
          </div>

          {legalTracker && (
            <div className="mt-4 pt-4 border-t space-y-2" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--text-muted)" }}>Complétude du dossier</span>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {formatPct(legalTracker.dossierCompletenessPct)}
                </span>
              </div>
              <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--bg-elevated)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${legalTracker.dossierCompletenessPct}%`, backgroundColor: "var(--agem-gold)" }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--text-muted)" }}>Autorisations obtenues</span>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {legalTracker.authorizationsObtained}/{legalTracker.authorizationsRequired}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Compteur 36 mois construction */}
        <div
          className="rounded-2xl border p-6"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Délai Construction - 36 mois
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Démarre après approbation Loi 022-2025 (M4)
              </p>
            </div>
            <StatusBadge
              label={construction36.isStarted ? "En cours" : "Non démarré"}
              variant={construction36.isStarted ? "info" : "neutral"}
              dot
            />
          </div>

          {construction36.isStarted ? (
            <>
              <div className="text-6xl font-bold mb-2" style={{ color: "var(--status-info)" }}>
                {construction36.monthsElapsed}
              </div>
              <p className="text-lg font-medium mb-4" style={{ color: "var(--text-secondary)" }}>
                mois écoulés sur 36
              </p>
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-elevated)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${construction36.constructionProgressVsTimePct}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: "var(--status-info)" }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                <span>Début : {construction36.startDate ? formatDate(construction36.startDate) : "-"}</span>
                <span>{formatPct(construction36.constructionProgressVsTimePct)}</span>
                <span>Fin : {construction36.deadlineDate ? formatDate(construction36.deadlineDate) : "-"}</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <Clock className="w-12 h-12 mb-3" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
                Le compteur 36 mois démarrera après réception de l'approbation Loi 022-2025
              </p>
              <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                Jalon M4 - Approbation prévue
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: "var(--bg-elevated)" }}>
        {(["matrice", "fiscal", "documents"] as const).map((tab) => (
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
            {tab === "matrice" ? "Matrice de conformité" : tab === "fiscal" ? "Avantages fiscaux DGI" : "Documents légaux"}
          </button>
        ))}
      </div>

      {/* Matrice de conformité */}
      {activeTab === "matrice" && (
        <div className="space-y-4">
          {phases.map((phase) => {
            const phaseActions = legalActions.filter((a) => a.phase === phase);
            return (
              <div
                key={phase}
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <div
                  className="px-4 py-2.5 border-b"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {phase}
                  </p>
                </div>
                <div>
                  {phaseActions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:bg-gray-50 transition-colors"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      <div className="mt-0.5 shrink-0">
                        {action.status === "COMPLETED" ? (
                          <CheckCircle className="w-4 h-4" style={{ color: "var(--status-success)" }} />
                        ) : action.status === "BLOCKED" ? (
                          <AlertTriangle className="w-4 h-4" style={{ color: "var(--status-danger)" }} />
                        ) : (
                          <Clock className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${action.status === "LEGAL_MILESTONE_PENDING" ? "font-bold" : ""}`}
                          style={{
                            color: action.status === "LEGAL_MILESTONE_PENDING" ? "var(--agem-gold)" : "var(--text-primary)",
                          }}
                        >
                          {action.title}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            Délai : {action.deadline}
                          </span>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            Resp. : {action.responsible}
                          </span>
                        </div>
                      </div>
                      
                      {canEdit ? (
                        <select
                          value={action.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value as LegalActionStatus;
                            const res = await updateLegalActionStatus({ 
                              actionId: action.id, 
                              status: newStatus 
                            });
                            if (res.success) toast.success("Statut mis à jour");
                            else toast.error(res.error || "Erreur lors de la mise à jour");
                          }}
                          className="text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--agem-gold)] cursor-pointer transition-all hover:bg-[var(--bg-card)]"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {Object.entries(ACTION_STATUS_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      ) : (
                        <StatusBadge
                          label={ACTION_STATUS_LABELS[action.status]}
                          variant={ACTION_STATUS_VARIANT[action.status]}
                          dot
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Avantages fiscaux */}
      {activeTab === "fiscal" && (
        <div>
          <div
            className="mb-3 p-3 rounded-xl flex items-center justify-between"
            style={{ backgroundColor: "rgba(201,169,97,0.08)", border: "1px solid rgba(201,169,97,0.2)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Total économies fiscales estimées
            </p>
            <p className="text-xl font-bold" style={{ color: "var(--agem-gold)" }}>
              {formatXOF(totalSavings, "compact")}
            </p>
          </div>

          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--bg-elevated)" }}>
                  {["Catégorie", "Éligibilité", "Statut dossier", "Agrément", "Économies estimées"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fiscalAdvantages.map((f) => (
                  <tr
                    key={f.id}
                    className="border-t hover:bg-gray-50 transition-colors"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <td className="px-3 py-2.5 text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {f.category}
                    </td>
                    <td className="px-3 py-2.5">
                      {canApprove ? (
                        <select
                          value={f.eligible}
                          onChange={async (e) => {
                            const val = e.target.value as EligibilityStatus;
                            await updateFiscalAdvantage({
                              id: f.id,
                              eligible: val,
                              dossierStatus: f.dossierStatus,
                              agrementStatus: f.agrementStatus,
                              estimatedSavingsXOF: Number(f.estimatedSavingsXOF)
                            });
                          }}
                          className="text-xs bg-transparent border-none focus:ring-0 p-0 font-medium"
                        >
                          {Object.entries(ELIGIBILITY_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      ) : (
                        <StatusBadge
                          label={ELIGIBILITY_LABELS[f.eligible]}
                          variant={f.eligible === "YES" ? "success" : f.eligible === "NO" ? "danger" : "warning"}
                          dot
                        />
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                      {canApprove ? (
                        <input
                          type="text"
                          defaultValue={f.dossierStatus}
                          onBlur={async (e) => {
                            if (e.target.value === f.dossierStatus) return;
                            await updateFiscalAdvantage({
                              id: f.id,
                              eligible: f.eligible,
                              dossierStatus: e.target.value,
                              agrementStatus: f.agrementStatus,
                              estimatedSavingsXOF: Number(f.estimatedSavingsXOF)
                            });
                          }}
                          className="w-full bg-transparent border-none focus:ring-0 p-0"
                        />
                      ) : f.dossierStatus}
                    </td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      {canApprove ? (
                        <input
                          type="text"
                          defaultValue={f.agrementStatus}
                          onBlur={async (e) => {
                            if (e.target.value === f.agrementStatus) return;
                            await updateFiscalAdvantage({
                              id: f.id,
                              eligible: f.eligible,
                              dossierStatus: f.dossierStatus,
                              agrementStatus: e.target.value,
                              estimatedSavingsXOF: Number(f.estimatedSavingsXOF)
                            });
                          }}
                          className="w-full bg-transparent border-none focus:ring-0 p-0"
                        />
                      ) : f.agrementStatus}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-semibold" style={{ color: "var(--status-success)" }}>
                      {canApprove ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            defaultValue={Number(f.estimatedSavingsXOF)}
                            onBlur={async (e) => {
                              const val = Number(e.target.value);
                              if (val === Number(f.estimatedSavingsXOF)) return;
                              const res = await updateFiscalAdvantage({
                                id: f.id,
                                eligible: f.eligible,
                                dossierStatus: f.dossierStatus,
                                agrementStatus: f.agrementStatus,
                                estimatedSavingsXOF: val
                              });
                              if (res.success) toast.success("Montant mis à jour");
                            }}
                            className="w-24 bg-transparent border-none focus:ring-0 p-0 font-semibold text-right"
                          />
                          <span className="text-[10px]">XOF</span>
                        </div>
                      ) : (
                        BigInt(f.estimatedSavingsXOF) > 0n ? formatXOF(BigInt(f.estimatedSavingsXOF), "compact") : "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Documents légaux */}
      {activeTab === "documents" && (
        <div
          className="rounded-xl border p-6 text-center"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
        >
          <Scale className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Accédez aux documents légaux dans la GED
          </p>
          <a href="/documents" className="mt-2 inline-block text-xs font-medium" style={{ color: "var(--agem-gold)" }}>
            Ouvrir le dossier 01 - Loi 022-2025
          </a>
        </div>
      )}
    </div>
  );
}
