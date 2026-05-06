"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Scale, AlertTriangle, Calendar,
  CheckCircle, Clock, ChevronRight, Activity, Zap
} from "lucide-react";
import { KpiCard } from "@/components/ui/KpiCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatXOF, formatDate, formatDuration, formatPct } from "@/lib/format";
import { getCpiZoneColor, getCpiZoneLabel } from "@/lib/evm";
import type { CpiZone } from "@/lib/evm";
import type { LegalAlertLevel } from "@/lib/legal";
import type { TaskPriority, MilestoneCriticality } from "@prisma/client";

interface DashboardData {
  project: {
    id: string;
    code: string;
    name: string;
    client: string;
    totalBudgetXOF: string;
    startDate: string;
    durationMonths: number;
    status: string;
  };
  currentMonth: number;
  accounting: {
    totalApprovedXOF: string;
    pendingApprovalsCount: number;
  };
  legalCountdown: {
    daysRemaining: number;
    totalLegalDays: number;
    progressionPct: number;
    alertLevel: LegalAlertLevel;
    alertLabel: string;
    alertColor: string;
  };
  legalTracker: {
    dossierCompletenessPct: number;
    authorizationsObtained: number;
    authorizationsRequired: number;
  } | null;
  criticalRisks: number;
  highRisks: number;
  myTasks: Array<{
    id: string;
    title: string;
    priority: TaskPriority;
    dueDate: string | null;
    boardName: string;
  }>;
  nextMilestone: {
    monthNumber: number;
    title: string;
    criticality: MilestoneCriticality;
    status: string;
  } | null;
  user: { id: string; role: string; name: string };
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: "var(--text-muted)",
  MEDIUM: "var(--status-info)",
  HIGH: "var(--status-warning)",
  URGENT: "var(--status-danger)",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Faible",
  MEDIUM: "Moyen",
  HIGH: "Élevé",
  URGENT: "Urgent",
};

export function DashboardClient({ data }: { data: DashboardData }) {
  const { project, currentMonth, accounting, legalCountdown, legalTracker, criticalRisks, myTasks, nextMilestone } = data;
  const today = new Date();

  const isCriticalAlert = legalCountdown.alertLevel === "ALERT_RED" ||
    legalCountdown.alertLevel === "OVERDUE";

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto min-h-full"
    >

      {/* Bannière d'alerte critique */}
      {isCriticalAlert && (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl p-5 flex items-start gap-4 bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 shadow-sm relative overflow-hidden"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
          <div className="p-2 bg-red-500/10 rounded-xl shrink-0">
            <Zap className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-base font-bold text-red-600 dark:text-red-400 mb-1">
              Alerte critique - Action requise immédiatement
            </p>
            {legalCountdown.alertLevel === "ALERT_RED" && (
              <p className="text-sm text-red-600/80 dark:text-red-400/80 font-medium">
                Loi 022-2025 : Il ne reste que <span className="font-bold">{legalCountdown.daysRemaining} jours</span> avant le délai légal du 30/06/2026.
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* En-tête projet Premium */}
      <motion.div variants={itemVariants} className="flex items-end justify-between flex-wrap gap-6 bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-subtle)] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[var(--agem-gold)]/5 to-transparent pointer-events-none" />
        <div className="relative z-10">

          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight mb-2">
            {project.name}
          </h1>
          <p className="text-sm font-medium text-[var(--text-muted)] flex items-center gap-2">
            <span className="text-[var(--text-secondary)]">{project.client}</span>
            <span>•</span>
            <span>Démarré le {formatDate(project.startDate)}</span>
          </p>
        </div>
        
        <div className="relative z-10 flex flex-col items-end">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Avancement global</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-gradient-gold tracking-tighter">M{currentMonth}</span>
            <span className="text-lg font-medium text-[var(--text-muted)]">/ {project.durationMonths}</span>
          </div>
          <div className="w-full h-2 mt-3 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(currentMonth / project.durationMonths) * 100}%` }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[var(--agem-gold)] to-[var(--agem-gold-dark)] rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* KPI Cards avec Hover Lift */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
        {/* Dépenses Approuvées */}
        <Link href="/accounting" className="hover-lift block">
          <div className="h-full bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-subtle)] shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-16 h-16 text-[var(--status-success)]" />
            </div>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Dépenses (Validées)</p>
            <p className="text-2xl font-black text-[var(--text-primary)] mb-1 truncate">{formatXOF(BigInt(accounting.totalApprovedXOF), "compact")}</p>
            <div className="flex items-center gap-1.5 mt-auto">
              <div className="w-2 h-2 rounded-full bg-[var(--status-success)]" />
              <p className="text-xs font-medium text-[var(--text-secondary)] truncate">Comptabilisées</p>
            </div>
          </div>
        </Link>

        {/* Dépenses en attente */}
        <Link href="/accounting" className="hover-lift block">
          <div className="h-full bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-subtle)] shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity className="w-16 h-16 text-[var(--status-warning)]" />
            </div>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">En attente d'approbation</p>
            <p className="text-3xl font-black text-[var(--text-primary)] mb-1">{accounting.pendingApprovalsCount}</p>
            <div className="flex items-center gap-1.5 mt-auto">
              <div className="w-2 h-2 rounded-full bg-[var(--status-warning)]" />
              <p className="text-xs font-medium text-[var(--text-secondary)] truncate">Transactions à vérifier</p>
            </div>
          </div>
        </Link>

        {/* Compteur Loi 022-2025 */}
        <Link href="/legal" className="hover-lift block">
          <div className="h-full bg-[var(--bg-card)] rounded-2xl p-5 border shadow-sm relative overflow-hidden group" style={{ borderColor: legalCountdown.alertColor }}>
            <div className="absolute top-0 right-0 w-full h-full opacity-5" style={{ backgroundColor: legalCountdown.alertColor }} />
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Loi 022-2025</p>
            <p className="text-3xl font-black mb-1" style={{ color: legalCountdown.alertColor }}>
              {legalCountdown.daysRemaining <= 0 ? "DÉPASSÉ" : `${legalCountdown.daysRemaining}j`}
            </p>
            <p className="text-xs font-medium truncate mt-auto" style={{ color: legalCountdown.alertColor }}>
              {legalCountdown.alertLabel}
            </p>
          </div>
        </Link>

        {/* Risques */}
        <Link href="/risks" className="hover-lift block">
          <div className="h-full bg-[var(--bg-card)] rounded-2xl p-5 border shadow-sm relative overflow-hidden group" style={{ borderColor: criticalRisks > 0 ? "var(--status-danger)" : "var(--status-success)" }}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <AlertTriangle className="w-16 h-16" style={{ color: criticalRisks > 0 ? "var(--status-danger)" : "var(--status-success)" }} />
            </div>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Risques majeurs</p>
            <p className="text-3xl font-black mb-1" style={{ color: criticalRisks > 0 ? "var(--status-danger)" : "var(--text-primary)" }}>
              {criticalRisks}
            </p>
            <p className="text-xs font-medium text-[var(--text-secondary)] truncate mt-auto">
              {data.highRisks} risques élevés
            </p>
          </div>
        </Link>
      </motion.div>

      {/* Section centrale : Contenu Principal */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">

        {/* Accounting Panel */}
        <motion.div variants={itemVariants} className="xl:col-span-2 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-elevated)]/50">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[var(--agem-gold)]" />
              Suivi Comptable
            </h2>
            <Link href="/accounting" className="text-sm font-semibold text-[var(--agem-gold)] hover:text-[var(--agem-gold-dark)] transition-colors flex items-center gap-1">
              Gérer <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col justify-center items-center text-center">
                <span className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Dépenses Cumulées Validées</span>
                <span className="text-4xl font-black text-[var(--status-success)]">{formatXOF(BigInt(accounting.totalApprovedXOF))}</span>
              </div>
              
              <div className="p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col justify-center items-center text-center">
                <span className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Dépenses en attente</span>
                <span className="text-4xl font-black text-[var(--status-warning)]">{accounting.pendingApprovalsCount}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sidebar droite */}
        <motion.div variants={itemVariants} className="space-y-6 lg:space-y-8">

          {/* Mes tâches */}
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-elevated)]/50">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Mes tâches actives</h3>
            </div>
            <div className="p-2">
              {myTasks.length === 0 ? (
                <div className="p-6 text-center">
                  <CheckCircle className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium text-[var(--text-muted)]">Aucune tâche assignée</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {myTasks.map((task) => (
                    <Link key={task.id} href="/tasks">
                      <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors group">
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 shrink-0 shadow-sm"
                          style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--agem-gold)] transition-colors">
                            {task.title}
                          </p>
                          {task.dueDate && (
                            <p className="text-xs font-medium mt-1 flex items-center text-[var(--text-muted)]">
                              <Clock className="w-3 h-3 mr-1" />
                              Échéance : {formatDate(task.dueDate)}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                  <div className="pt-2 px-3 pb-2">
                    <Link href="/tasks" className="text-xs font-bold text-[var(--agem-gold)] hover:underline flex items-center justify-center p-2 rounded-lg bg-[var(--agem-gold)]/5">
                      Voir le Kanban complet
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Prochain jalon */}
          {nextMilestone && (
            <div className="bg-gradient-to-br from-[var(--agem-black)] to-[var(--agem-graphite)] rounded-3xl border border-[var(--border-subtle)] shadow-xl p-6 text-white relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--agem-gold)]/20 rounded-full blur-2xl group-hover:bg-[var(--agem-gold)]/30 transition-colors" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">Prochain Jalon Stratégique</h3>
              
              <div className="flex items-center gap-2 mb-3">
                <div className="px-3 py-1 rounded-full bg-[var(--agem-gold)]/20 border border-[var(--agem-gold)]/30 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--agem-gold)]" />
                  <span className="text-xs font-black text-[var(--agem-gold)]">Mois {nextMilestone.monthNumber}</span>
                </div>
              </div>
              
              <p className="text-lg font-bold text-white mb-4 leading-tight">
                {nextMilestone.title}
              </p>
              
              <Link href="/planning" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--agem-gold-light)] hover:text-white transition-colors">
                Ouvrir le planning <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
