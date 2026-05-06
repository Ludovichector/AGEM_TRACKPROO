"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from "recharts";
import { TrendingUp, Plus, Download } from "lucide-react";
import { formatXOF, formatDate, formatMonth } from "@/lib/format";
import { getCpiZoneColor, getCpiZoneLabel } from "@/lib/evm";
import type { CpiZone } from "@/lib/evm";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EvmEntryDialog } from "@/components/evm/EvmEntryDialog";

interface EvmEntry {
  id: string;
  monthNumber: number;
  monthDate: string;
  pvCumulXOF: string;
  evCumulXOF: string;
  acCumulXOF: string;
  bacXOF: string;
  physicalProgress: number;
  notes: string | null;
  validatedAt: string | null;
  enteredBy: string;
  cpi: number | null;
  spi: number | null;
  cpiZone: CpiZone;
  penaltyPct: number;
  eacXOF: string | null;
  alertLevel: string;
  alertMessage: string;
}

interface EvmPageClientProps {
  entries: EvmEntry[];
  projectId: string;
  bacXOF: string;
  durationMonths: number;
  startDate: string;
  canEdit: boolean;
  canExport: boolean;
  userId: string;
}

export function EvmPageClient({
  entries,
  projectId,
  bacXOF,
  durationMonths,
  startDate,
  canEdit,
  canExport,
  userId,
}: EvmPageClientProps) {
  const [activeTab, setActiveTab] = useState<"table" | "chart" | "penalties">("table");
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);

  const chartData = entries.map((e) => ({
    month: `M${e.monthNumber}`,
    PV: Number(BigInt(e.pvCumulXOF)) / 1_000_000,
    EV: Number(BigInt(e.evCumulXOF)) / 1_000_000,
    AC: Number(BigInt(e.acCumulXOF)) / 1_000_000,
  }));

  const latestEntry = entries[entries.length - 1];

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            EVM - Pilotage Budgétaire
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Earned Value Management - BAC : {formatXOF(BigInt(bacXOF), "compact")} - {durationMonths} mois
          </p>
        </div>
        <div className="flex gap-2">
          {canExport && (
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => setEntryDialogOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: "var(--agem-gold)", color: "var(--agem-black)" }}
            >
              <Plus className="w-4 h-4" />
              Saisir le mois courant
            </button>
          )}
        </div>
      </div>

      {/* Alerte EVM */}
      {latestEntry?.alertLevel !== "NONE" && latestEntry?.alertMessage && (
        <div
          className="rounded-xl p-3 text-sm"
          style={{
            backgroundColor: latestEntry.alertLevel === "CRITICAL"
              ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)",
            borderLeft: `3px solid ${latestEntry.alertLevel === "CRITICAL" ? "var(--status-danger)" : "var(--status-warning)"}`,
          }}
        >
          <p className="font-medium" style={{
            color: latestEntry.alertLevel === "CRITICAL" ? "var(--status-danger)" : "var(--status-warning)"
          }}>
            {latestEntry.alertMessage}
          </p>
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: "var(--bg-elevated)" }}>
        {(["table", "chart", "penalties"] as const).map((tab) => (
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
            {tab === "table" ? "Tableau" : tab === "chart" ? "Courbe en S" : "Pénalités"}
          </button>
        ))}
      </div>

      {/* Tableau */}
      {activeTab === "table" && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--bg-elevated)" }}>
                  {["Mois", "PV Cum.", "EV Cum.", "AC Cum.", "CPI", "SPI", "EAC", "Zone", "Saisi par"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                      Aucune saisie EVM pour le moment.{" "}
                      {canEdit && (
                        <button
                          onClick={() => setEntryDialogOpen(true)}
                          style={{ color: "var(--agem-gold)" }}
                          className="hover:underline"
                        >
                          Saisir les données du premier mois
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, idx) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-t hover:bg-gray-50 transition-colors"
                      style={{
                        borderColor: "var(--border-subtle)",
                        backgroundColor: entry.cpiZone === "PENALTY_10" ? "rgba(239,68,68,0.04)" :
                          entry.cpiZone === "PENALTY_5" ? "rgba(249,115,22,0.04)" : undefined,
                      }}
                    >
                      <td className="px-3 py-2.5 font-medium" style={{ color: "var(--agem-gold)" }}>
                        M{entry.monthNumber}
                      </td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                        {formatXOF(BigInt(entry.pvCumulXOF), "compact")}
                      </td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: "var(--status-success)" }}>
                        {formatXOF(BigInt(entry.evCumulXOF), "compact")}
                      </td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                        {formatXOF(BigInt(entry.acCumulXOF), "compact")}
                      </td>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: entry.cpi !== null ? getCpiZoneColor(entry.cpiZone) : "var(--text-muted)" }}>
                        {entry.cpi !== null ? entry.cpi.toFixed(3) : "-"}
                      </td>
                      <td className="px-3 py-2.5" style={{ color: (entry.spi ?? 1) >= 0.9 ? "var(--status-success)" : "var(--status-warning)" }}>
                        {entry.spi !== null ? entry.spi.toFixed(3) : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                        {entry.eacXOF ? formatXOF(BigInt(entry.eacXOF), "compact") : "-"}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge
                          label={getCpiZoneLabel(entry.cpiZone)}
                          variant={
                            entry.cpiZone === "GREEN" ? "success" :
                              entry.cpiZone === "YELLOW" ? "warning" : "danger"
                          }
                          dot
                        />
                      </td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>
                        {entry.enteredBy}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Courbe en S */}
      {activeTab === "chart" && (
        <div
          className="rounded-xl border p-5"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Courbe en S - PV / EV / AC (en Millions FCFA)
          </h3>
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48">
              <TrendingUp className="w-10 h-10 mb-2" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Aucune donnée à afficher</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border-subtle)",
                    fontSize: 12,
                  }}
                  formatter={(value) => [`${(value as number).toFixed(1)} M FCFA`]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="PV" stroke="#3B82F6" strokeWidth={2} dot={false} name="PV (Planifié)" />
                <Line type="monotone" dataKey="EV" stroke="#10B981" strokeWidth={2} dot={false} name="EV (Acquis)" />
                <Line type="monotone" dataKey="AC" stroke="#F59E0B" strokeWidth={2} dot={false} name="AC (Réel)" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Pénalités */}
      {activeTab === "penalties" && (
        <div
          className="rounded-xl border"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
        >
          <div className="p-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Seuils de pénalités contractuelles - TDR §7-9
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              BAC : {formatXOF(BigInt(bacXOF), "compact")}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--bg-elevated)" }}>
                  {["Zone", "Condition CPI", "Pénalité", "Montant (BAC={formatXOF(BigInt(bacXOF),'compact')})", "Action AMOA requise"].map((h, i) => (
                    <th key={i} className="px-3 py-2.5 text-left text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { zone: "Verte", condition: "CPI ≥ 0,95", penalty: "0%", amount: "Aucune pénalité", action: "Projet sous contrôle", color: "#10B981" },
                  { zone: "Jaune", condition: "0,90 ≤ CPI < 0,95", penalty: "0% (surveillance)", amount: "Aucune pénalité", action: "Alerte interne - Plan d'action", color: "#F59E0B" },
                  { zone: "Pénalité 2%", condition: "0,85 ≤ CPI < 0,90", penalty: "2%", amount: formatXOF(BigInt(bacXOF) * 2n / 100n, "compact"), action: "Note d'alerte au DG requise", color: "#F97316" },
                  { zone: "Pénalité 5%", condition: "0,80 ≤ CPI < 0,85", penalty: "5%", amount: formatXOF(BigInt(bacXOF) * 5n / 100n, "compact"), action: "Mobilisation d'urgence + CoPil", color: "#EF4444" },
                  { zone: "Pénalité 10%", condition: "CPI < 0,80", penalty: "10% (plafond)", amount: formatXOF(BigInt(bacXOF) * 10n / 100n, "compact"), action: "Réunion de crise - Direction Générale", color: "#7F1D1D" },
                ].map((row, idx) => (
                  <tr key={idx} className="border-t" style={{ borderColor: "var(--border-subtle)" }}>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
                        <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{row.zone}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{row.condition}</td>
                    <td className="px-3 py-2.5 text-xs font-semibold" style={{ color: row.color }}>{row.penalty}</td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>{row.amount}</td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialog saisie EVM */}
      {entryDialogOpen && (
        <EvmEntryDialog
          projectId={projectId}
          bacXOF={bacXOF}
          userId={userId}
          durationMonths={durationMonths}
          nextMonthNumber={(entries[entries.length - 1]?.monthNumber ?? 0) + 1}
          onClose={() => setEntryDialogOpen(false)}
        />
      )}
    </div>
  );
}
