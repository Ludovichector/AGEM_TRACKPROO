"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { XCircle, FileUp, Loader2 } from "lucide-react";
import { uploadReport } from "@/app/(dashboard)/reports/actions";

interface ReportUploadFormProps {
  onClose: () => void;
}

export function ReportUploadForm({ onClose }: ReportUploadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    
    try {
      await uploadReport(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'upload du rapport.");
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-elevated)]/50">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Uploader un Rapport</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">Le document sera automatiquement classé dans la GED</p>
          </div>
          <button onClick={onClose} className="p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors">
            <XCircle className="w-6 h-6 text-[var(--text-muted)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/30 text-[var(--status-danger)] rounded-xl text-sm font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Titre du Rapport *</label>
            <input 
              type="text" 
              name="title"
              required
              placeholder="Ex: Rapport d'avancement M03"
              className="w-full bg-[var(--bg-elevated)] text-[var(--text-primary)] px-4 py-3 rounded-xl border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--agem-gold)] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Période *</label>
              <input 
                type="text" 
                name="period"
                required
                placeholder="Ex: Mai 2026"
                className="w-full bg-[var(--bg-elevated)] text-[var(--text-primary)] px-4 py-3 rounded-xl border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--agem-gold)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Type *</label>
              <select 
                name="type"
                required
                className="w-full bg-[var(--bg-elevated)] text-[var(--text-primary)] px-4 py-3 rounded-xl border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--agem-gold)] transition-colors"
              >
                <option value="WEEKLY_FLASH">Flash Hebdo</option>
                <option value="MONTHLY">Mensuel</option>
                <option value="MILESTONE">Jalon</option>
                <option value="CUSTOM">Personnalisé</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Fichier Document (URL/PDF) *</label>
            <input 
              type="url" 
              name="fileUrl"
              required
              placeholder="https://..."
              className="w-full bg-[var(--bg-elevated)] text-[var(--text-primary)] px-4 py-3 rounded-xl border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--agem-gold)] transition-colors"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl font-bold text-[var(--text-muted)] hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[var(--agem-gold)] text-black rounded-xl font-bold flex items-center gap-2 hover:bg-[var(--agem-gold-dark)] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
              Uploader et Classer
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
