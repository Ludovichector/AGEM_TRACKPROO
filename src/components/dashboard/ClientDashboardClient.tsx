"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import {
  Calendar, ChevronRight, Activity, CloudRain, Sun, Cloud, CloudLightning, Camera, AlertTriangle
} from "lucide-react";
import { formatDate } from "@/lib/format";
import type { TaskPriority, MilestoneCriticality } from "@prisma/client";

interface ClientDashboardData {
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
  projectHealth: {
    overallScore: number;
    scheduleScore: number;
    budgetScore: number;
    qualityScore: number;
    safetyScore: number;
    weatherEmoji: string;
    commentary: string | null;
  } | null;
  recentPhotos: Array<{
    id: string;
    zone: string;
    thumbnailUrl: string | null;
    fileUrl: string;
    takenAt: string;
  }>;
  criticalRisks: number;
  nextMilestone: {
    monthNumber: number;
    title: string;
    status: string;
  } | null;
  user: { id: string; role: string; name: string };
}

export function ClientDashboardClient({ data }: { data: ClientDashboardData }) {
  const { project, currentMonth, projectHealth, recentPhotos, criticalRisks, nextMilestone } = data;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
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
      {/* En-tête projet Premium */}
      <motion.div variants={itemVariants} className="flex items-end justify-between flex-wrap gap-6 bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-subtle)] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[var(--agem-gold)]/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight mb-2">
            Vue d'ensemble - {project.name}
          </h1>
          <p className="text-sm font-medium text-[var(--text-muted)] flex items-center gap-2">
            <span className="text-[var(--text-secondary)]">Espace Client Exécutif</span>
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

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        
        {/* Météo du Chantier */}
        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-subtle)] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl">{projectHealth?.weatherEmoji || "⛅"}</span>
          </div>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Météo du Chantier</p>
          <p className="text-4xl font-black text-[var(--text-primary)] mb-1">
            {projectHealth?.weatherEmoji || "⛅"}
          </p>
          <div className="mt-3">
            <p className="text-sm font-medium text-[var(--text-secondary)] line-clamp-2">
              {projectHealth?.commentary || "Aucun commentaire pour le moment."}
            </p>
          </div>
        </div>

        {/* Santé Globale */}
        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-subtle)] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-16 h-16 text-[var(--agem-gold)]" />
          </div>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Santé Globale</p>
          <div className="flex items-end gap-2 mb-1">
            <p className="text-4xl font-black text-[var(--text-primary)]">{projectHealth?.overallScore || 0}</p>
            <span className="text-lg font-bold text-[var(--text-muted)] mb-1">/ 100</span>
          </div>
          <div className="w-full h-1.5 mt-3 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
            <div 
              className="h-full bg-[var(--agem-gold)] rounded-full" 
              style={{ width: `${projectHealth?.overallScore || 0}%` }}
            />
          </div>
        </div>

        {/* Prochain Jalon */}
        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-subtle)] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Calendar className="w-16 h-16 text-[var(--status-info)]" />
          </div>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Prochain Jalon</p>
          <p className="text-lg font-bold text-[var(--text-primary)] mb-1 line-clamp-2 min-h-[3rem]">
            {nextMilestone?.title || "Aucun jalon à venir"}
          </p>
          {nextMilestone && (
             <p className="text-sm font-medium text-[var(--status-info)] mt-auto">Mois {nextMilestone.monthNumber}</p>
          )}
        </div>

        {/* Risques Majeurs */}
        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border shadow-sm relative overflow-hidden group" style={{ borderColor: criticalRisks > 0 ? "var(--status-danger)" : "var(--status-success)" }}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className="w-16 h-16" style={{ color: criticalRisks > 0 ? "var(--status-danger)" : "var(--status-success)" }} />
          </div>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Points d'attention</p>
          <p className="text-4xl font-black mb-1" style={{ color: criticalRisks > 0 ? "var(--status-danger)" : "var(--text-primary)" }}>
            {criticalRisks}
          </p>
          <p className="text-sm font-medium mt-auto" style={{ color: criticalRisks > 0 ? "var(--status-danger)" : "var(--status-success)" }}>
            {criticalRisks > 0 ? "Risques critiques actifs" : "Aucun risque critique"}
          </p>
        </div>

      </motion.div>

      {/* Galerie Aperçu */}
      <motion.div variants={itemVariants} className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-elevated)]/50">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Camera className="w-5 h-5 text-[var(--agem-gold)]" />
            Dernières Photos du Chantier
          </h2>
          <Link href="/photos" className="text-sm font-semibold text-[var(--agem-gold)] hover:text-[var(--agem-gold-dark)] transition-colors flex items-center gap-1">
            Voir toute la galerie <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="p-6">
          {recentPhotos.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-muted)]">
              <Camera className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Aucune photo récente</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentPhotos.map(photo => (
                <div key={photo.id} className="relative rounded-xl overflow-hidden group aspect-video bg-black/5">
                  <img 
                    src={photo.thumbnailUrl || photo.fileUrl} 
                    alt={photo.zone}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                  <div className="absolute bottom-0 left-0 p-4 w-full">
                    <p className="text-white font-bold truncate">{photo.zone}</p>
                    <p className="text-white/70 text-xs">{formatDate(photo.takenAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

    </motion.div>
  );
}
