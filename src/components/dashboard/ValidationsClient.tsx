"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, FileText, AlertTriangle, ChevronRight, XCircle, FileSignature } from "lucide-react";
import { formatDate } from "@/lib/format";
import { ValidationSubmitForm } from "./ValidationSubmitForm";

interface Reserve {
  id: string;
  category: string;
  description: string;
  priority: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

interface Validation {
  id: string;
  title: string;
  description: string | null;
  status: string;
  documentUrl: string | null;
  submittedAt: string;
  submittedBy: {
    name: string;
    role: string;
  };
  reviewedAt: string | null;
  reviewedBy: string | null;
  comment: string | null;
  reserves: Reserve[];
}

export function ValidationsClient({ 
  validations, 
  userRole, 
  clientUsers, 
  milestones 
}: { 
  validations: Validation[], 
  userRole: string,
  clientUsers: { id: string; fullName: string; role: string; }[],
  milestones: { id: string; title: string; monthNumber: number; }[]
}) {
  const [activeTab, setActiveTab] = useState<"PENDING" | "PROCESSED">("PENDING");
  const [selectedValidation, setSelectedValidation] = useState<Validation | null>(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  const pendingValidations = validations.filter(v => v.status === "PENDING");
  const processedValidations = validations.filter(v => v.status !== "PENDING");

  const displayList = activeTab === "PENDING" ? pendingValidations : processedValidations;

  const isClient = userRole === "MOA_DG" || userRole === "MOA_COPIL";

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PENDING": return { icon: Clock, color: "text-[var(--status-warning)]", bg: "bg-[var(--status-warning)]/10", label: "En attente" };
      case "APPROVED": return { icon: CheckCircle2, color: "text-[var(--status-success)]", bg: "bg-[var(--status-success)]/10", label: "Approuvé" };
      case "APPROVED_WITH_RESERVES": return { icon: AlertTriangle, color: "text-[var(--status-warning)]", bg: "bg-[var(--status-warning)]/10", label: "Approuvé avec réserves" };
      case "REJECTED": return { icon: XCircle, color: "text-[var(--status-danger)]", bg: "bg-[var(--status-danger)]/10", label: "Rejeté" };
      default: return { icon: Clock, color: "text-[var(--text-muted)]", bg: "bg-[var(--bg-elevated)]", label: status };
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1200px] mx-auto min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-2 flex items-center gap-3">
            <FileSignature className="w-8 h-8 text-[var(--agem-gold)]" />
            Validations & Approbations
          </h1>
          <p className="text-[var(--text-muted)]">
            Validation formelle des jalons, livrables et décisions clés du projet.
          </p>
        </div>
        {!isClient && userRole !== "OBSERVATEUR" && (
          <button 
            onClick={() => setShowSubmitForm(true)}
            className="shrink-0 px-5 py-2.5 bg-[var(--agem-gold)] text-black rounded-xl font-bold flex items-center gap-2 hover:bg-[var(--agem-gold-dark)] transition-colors shadow-lg shadow-[var(--agem-gold)]/20"
          >
            <FileSignature className="w-5 h-5" /> Nouvelle Soumission
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)]">
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "PENDING" 
              ? "border-[var(--agem-gold)] text-[var(--agem-gold)]" 
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
        >
          À Traiter
          {pendingValidations.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[var(--agem-gold)] text-black text-xs">
              {pendingValidations.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("PROCESSED")}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "PROCESSED" 
              ? "border-[var(--agem-gold)] text-[var(--text-primary)]" 
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
        >
          Historique
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {displayList.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="py-12 text-center text-[var(--text-muted)] bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)]"
            >
              <FileSignature className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Aucune validation dans cette catégorie.</p>
            </motion.div>
          ) : (
            displayList.map((val) => {
              const statusConf = getStatusConfig(val.status);
              const StatusIcon = statusConf.icon;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={val.id}
                  onClick={() => setSelectedValidation(val)}
                  className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-subtle)] hover:border-[var(--agem-gold)] shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col md:flex-row gap-4 md:items-center"
                >
                  <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${statusConf.bg}`}>
                    <StatusIcon className={`w-6 h-6 ${statusConf.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--agem-gold)] transition-colors">
                      {val.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-1 mt-1">
                      {val.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs font-medium text-[var(--text-muted)]">
                      <span>Soumis par {val.submittedBy.name} le {formatDate(val.submittedAt)}</span>
                      {val.reserves.length > 0 && (
                        <span className="flex items-center gap-1 text-[var(--status-warning)]">
                          <AlertTriangle className="w-3.5 h-3.5" /> {val.reserves.length} réserves
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border border-current ${statusConf.color} ${statusConf.bg}`}>
                      {statusConf.label}
                    </span>
                    <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--agem-gold)] transition-colors" />
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Modal Détails & Action */}
      <AnimatePresence>
        {selectedValidation && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setSelectedValidation(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden flex flex-col max-h-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-[var(--border-subtle)] flex items-start justify-between bg-[var(--bg-elevated)]/50">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{selectedValidation.title}</h2>
                    {selectedValidation.status !== "PENDING" && (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border border-current ${getStatusConfig(selectedValidation.status).color} ${getStatusConfig(selectedValidation.status).bg}`}>
                        {getStatusConfig(selectedValidation.status).label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">Soumis le {formatDate(selectedValidation.submittedAt)} par {selectedValidation.submittedBy.name}</p>
                  {selectedValidation.reviewedAt && selectedValidation.reviewedBy && (
                    <p className="text-sm font-medium text-[var(--text-primary)] mt-1">
                      Validé le {formatDate(selectedValidation.reviewedAt)} par <span className="text-[var(--agem-gold)]">{selectedValidation.reviewedBy}</span>
                    </p>
                  )}
                </div>
                <button onClick={() => setSelectedValidation(null)} className="p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors">
                  <XCircle className="w-6 h-6 text-[var(--text-muted)]" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Description</h4>
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-subtle)]">
                    {selectedValidation.description || "Aucune description fournie."}
                  </p>
                </div>

                {selectedValidation.reserves.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-2">
                      Réserves émises <span className="px-2 py-0.5 bg-[var(--status-warning)]/20 text-[var(--status-warning)] rounded-full">{selectedValidation.reserves.length}</span>
                    </h4>
                    <div className="space-y-3">
                      {selectedValidation.reserves.map(reserve => (
                        <div key={reserve.id} className="p-4 rounded-xl border border-[var(--status-warning)]/30 bg-[var(--status-warning)]/5">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-xs font-bold px-2 py-1 bg-[var(--status-warning)]/20 text-[var(--status-warning)] rounded-md">
                              {reserve.category}
                            </span>
                            <span className={`text-xs font-bold ${reserve.resolvedAt ? "text-[var(--status-success)]" : "text-[var(--text-muted)]"}`}>
                              {reserve.resolvedAt ? `Levée le ${formatDate(reserve.resolvedAt)}` : "En attente de levée"}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{reserve.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedValidation.comment && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Commentaire du valideur</h4>
                    <p className="text-sm italic text-[var(--text-secondary)] bg-[var(--bg-elevated)] p-4 rounded-xl border-l-4 border-[var(--agem-gold)]">
                      "{selectedValidation.comment}"
                    </p>
                  </div>
                )}
              </div>

              {selectedValidation.status === "PENDING" && isClient && (
                <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex gap-3 flex-col sm:flex-row">
                  <button className="flex-1 px-4 py-3 bg-[var(--status-success)] text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-[var(--status-success)]/20">
                    <CheckCircle2 className="w-5 h-5" /> Approuver
                  </button>
                  <button className="flex-1 px-4 py-3 bg-[var(--status-warning)] text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-[var(--status-warning)]/20">
                    <AlertTriangle className="w-5 h-5" /> Approuver avec réserves
                  </button>
                  <button className="flex-1 px-4 py-3 bg-transparent border border-[var(--status-danger)] text-[var(--status-danger)] font-bold rounded-xl hover:bg-[var(--status-danger)]/10 transition-colors flex items-center justify-center gap-2">
                    <XCircle className="w-5 h-5" /> Rejeter
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSubmitForm && (
          <ValidationSubmitForm 
            onClose={() => setShowSubmitForm(false)} 
            clientUsers={clientUsers}
            milestones={milestones}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
