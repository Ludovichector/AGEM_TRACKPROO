"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileBarChart, Download, FileText, Send, Clock, FileWarning, Eye, Search } from "lucide-react";
import { formatDate } from "@/lib/format";
import { ReportUploadForm } from "./ReportUploadForm";

interface Report {
  id: string;
  type: string;
  title: string;
  period: string;
  status: string;
  fileUrl: string | null;
  generatedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  createdBy: string;
}

export function ReportsClient({ reports, userRole }: { reports: Report[], userRole: string }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [showUploadForm, setShowUploadForm] = useState(false);

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.period.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "ALL" || r.type === filterType;
    return matchesSearch && matchesType;
  });

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case "WEEKLY_FLASH": return "Flash Hebdo";
      case "MONTHLY": return "Mensuel";
      case "MILESTONE": return "Jalon";
      case "CUSTOM": return "Personnalisé";
      default: return type;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "DRAFT": return { icon: Clock, color: "text-[var(--text-muted)]", bg: "bg-[var(--bg-elevated)]", label: "Brouillon" };
      case "GENERATED": return { icon: FileText, color: "text-[var(--status-info)]", bg: "bg-[var(--status-info)]/10", label: "Généré" };
      case "SENT": return { icon: Send, color: "text-[var(--status-success)]", bg: "bg-[var(--status-success)]/10", label: "Envoyé" };
      case "ARCHIVED": return { icon: FileWarning, color: "text-[var(--text-muted)]", bg: "bg-[var(--bg-elevated)]", label: "Archivé" };
      default: return { icon: FileText, color: "text-[var(--text-muted)]", bg: "bg-[var(--bg-elevated)]", label: status };
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1400px] mx-auto min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-2 flex items-center gap-3">
            <FileBarChart className="w-8 h-8 text-[var(--agem-gold)]" />
            Rapports Automatiques
          </h1>
          <p className="text-[var(--text-muted)]">
            Génération et consultation des rapports de suivi de chantier.
          </p>
        </div>
        {userRole !== "MOA_DG" && userRole !== "MOA_COPIL" && (
          <button 
            onClick={() => setShowUploadForm(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--agem-gold)] text-black rounded-lg font-bold hover:bg-[var(--agem-gold-dark)] transition-colors shadow-lg shadow-[var(--agem-gold)]/20"
          >
            <FileText className="w-5 h-5" />
            Nouveau Rapport
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-subtle)] shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
          <input 
            type="text" 
            placeholder="Rechercher un rapport (titre, période)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--bg-elevated)] text-[var(--text-primary)] pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--agem-gold)] transition-colors"
          />
        </div>
        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full sm:w-auto bg-[var(--bg-elevated)] text-[var(--text-primary)] px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--agem-gold)] transition-colors"
        >
          <option value="ALL">Tous les types</option>
          <option value="WEEKLY_FLASH">Flash Hebdo</option>
          <option value="MONTHLY">Mensuels</option>
          <option value="MILESTONE">Jalons</option>
          <option value="CUSTOM">Personnalisés</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredReports.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="col-span-full py-16 text-center text-[var(--text-muted)] bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)]"
            >
              <FileBarChart className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">Aucun rapport trouvé pour ces critères.</p>
            </motion.div>
          ) : (
            filteredReports.map((report) => {
              const statusConf = getStatusConfig(report.status);
              
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={report.id}
                  className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden shadow-sm hover:shadow-md hover:border-[var(--agem-gold)] transition-all group flex flex-col"
                >
                  <div className="p-5 border-b border-[var(--border-subtle)] flex items-start justify-between bg-[var(--bg-elevated)]/30">
                    <div>
                      <span className="inline-block px-2 py-1 bg-[var(--bg-elevated)] rounded border border-[var(--border-subtle)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                        {getReportTypeLabel(report.type)}
                      </span>
                      <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--agem-gold)] transition-colors line-clamp-1">
                        {report.title}
                      </h3>
                      <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">Période : {report.period}</p>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-muted)]">Statut</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${statusConf.bg} ${statusConf.color}`}>
                          <statusConf.icon className="w-3 h-3" /> {statusConf.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-muted)]">Créé le</span>
                        <span className="font-medium text-[var(--text-primary)]">{formatDate(report.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-muted)]">Auteur</span>
                        <span className="font-medium text-[var(--text-primary)] truncate max-w-[120px]">{report.createdBy}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-[var(--border-subtle)]">
                      <button 
                        onClick={() => window.open(report.fileUrl?.startsWith('/') ? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' : report.fileUrl!, '_blank')}
                        className="flex-1 px-3 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!report.fileUrl}
                      >
                        <Eye className="w-4 h-4" /> Voir
                      </button>
                      <button 
                        onClick={() => window.open(report.fileUrl?.startsWith('/') ? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' : report.fileUrl!, '_blank')}
                        className="flex-1 px-3 py-2 bg-[var(--agem-gold)]/10 hover:bg-[var(--agem-gold)]/20 text-[var(--agem-gold)] rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!report.fileUrl}
                      >
                        <Download className="w-4 h-4" /> Exporter
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showUploadForm && (
          <ReportUploadForm onClose={() => setShowUploadForm(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
