"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XCircle, CheckCircle2, FileUp, Send, Loader2 } from "lucide-react";
import { submitValidation } from "@/app/(dashboard)/validations/actions";

interface ClientUser {
  id: string;
  fullName: string;
  role: string;
}

interface Milestone {
  id: string;
  title: string;
  monthNumber: number;
}

interface ValidationSubmitFormProps {
  onClose: () => void;
  clientUsers: ClientUser[];
  milestones: Milestone[];
}

export function ValidationSubmitForm({ onClose, clientUsers, milestones }: ValidationSubmitFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggleReviewer = (id: string) => {
    setSelectedReviewers(prev => 
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (selectedReviewers.length === 0) {
      setError("Veuillez sélectionner au moins un validateur.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    selectedReviewers.forEach(id => formData.append("reviewers", id));

    try {
      await submitValidation(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la soumission.");
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
        className="w-full max-w-2xl bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden flex flex-col max-h-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-elevated)]/50">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Nouvelle Demande de Validation</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">Soumettre un jalon ou document pour approbation</p>
          </div>
          <button onClick={onClose} className="p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors">
            <XCircle className="w-6 h-6 text-[var(--text-muted)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/30 text-[var(--status-danger)] rounded-xl text-sm font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Titre de la demande *</label>
            <input 
              type="text" 
              name="title"
              required
              placeholder="Ex: Programme Architectural Définitif"
              className="w-full bg-[var(--bg-elevated)] text-[var(--text-primary)] px-4 py-3 rounded-xl border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--agem-gold)] transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Jalon associé (Optionnel)</label>
              <select 
                name="milestoneId"
                className="w-full bg-[var(--bg-elevated)] text-[var(--text-primary)] px-4 py-3 rounded-xl border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--agem-gold)] transition-colors"
              >
                <option value="">-- Aucun jalon spécifique --</option>
                {milestones.map(m => (
                  <option key={m.id} value={m.id}>M{m.monthNumber} - {m.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Lien Documentaire (GED)</label>
              <input 
                type="url" 
                name="documentUrl"
                placeholder="https://..."
                className="w-full bg-[var(--bg-elevated)] text-[var(--text-primary)] px-4 py-3 rounded-xl border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--agem-gold)] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Description / Note d'accompagnement</label>
            <textarea 
              name="description"
              rows={4}
              placeholder="Détails importants pour faciliter la validation..."
              className="w-full bg-[var(--bg-elevated)] text-[var(--text-primary)] px-4 py-3 rounded-xl border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--agem-gold)] transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Assigner aux Validateurs (Client) *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {clientUsers.map(user => {
                const isSelected = selectedReviewers.includes(user.id);
                return (
                  <div 
                    key={user.id}
                    onClick={() => toggleReviewer(user.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? "border-[var(--agem-gold)] bg-[var(--agem-gold)]/10" 
                        : "border-[var(--border-subtle)] hover:border-white/20 bg-[var(--bg-elevated)]"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                      isSelected ? "bg-[var(--agem-gold)] border-[var(--agem-gold)]" : "border-white/20"
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isSelected ? "text-[var(--agem-gold)]" : "text-[var(--text-primary)]"}`}>
                        {user.fullName}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{user.role}</p>
                    </div>
                  </div>
                );
              })}
            </div>
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
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Soumettre
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
