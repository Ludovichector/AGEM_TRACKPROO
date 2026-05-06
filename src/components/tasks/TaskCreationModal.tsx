"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, User, Flag, AlignLeft } from "lucide-react";
import type { Role, TaskPriority } from "@prisma/client";
import { ROLE_COLORS } from "@/lib/permissions";

interface UserSummary {
  id: string;
  fullName: string;
  role: Role;
}

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    assigneeId: string | undefined;
    priority: TaskPriority;
    dueDate: string | undefined;
  }) => void;
  users: UserSummary[];
  isPending: boolean;
}

export function TaskCreationModal({ isOpen, onClose, onSubmit, users, isPending }: TaskCreationModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onSubmit({
      title,
      description,
      assigneeId: assigneeId || undefined,
      priority,
      dueDate: dueDate || undefined,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Nouvelle Tâche</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-[var(--bg-card)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <form id="create-task-form" onSubmit={handleSubmit} className="space-y-5">
                {/* Titre */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[var(--text-primary)]">Titre de la tâche *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Rédaction du compte-rendu de chantier"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--agem-gold)]"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-[var(--text-muted)]" /> Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Ajoutez plus de détails..."
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--agem-gold)] resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Assigné à */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                      <User className="w-4 h-4 text-[var(--text-muted)]" /> Assigner à
                    </label>
                    <select
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--agem-gold)] appearance-none"
                    >
                      <option value="">Non assigné</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.fullName} ({u.role.split('_').pop()})</option>
                      ))}
                    </select>
                  </div>

                  {/* Priorité */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                      <Flag className="w-4 h-4 text-[var(--text-muted)]" /> Priorité
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--agem-gold)] appearance-none"
                    >
                      <option value="LOW">Faible</option>
                      <option value="MEDIUM">Moyenne</option>
                      <option value="HIGH">Élevée</option>
                      <option value="URGENT">Urgente</option>
                    </select>
                  </div>
                </div>

                {/* Date limite */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--text-muted)]" /> Date d'échéance
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--agem-gold)]"
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                disabled={isPending}
              >
                Annuler
              </button>
              <button
                type="submit"
                form="create-task-form"
                disabled={isPending || !title.trim()}
                className="px-5 py-2.5 rounded-xl bg-[var(--agem-gold)] text-[var(--agem-black)] text-sm font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[var(--agem-black)]/30 border-t-[var(--agem-black)] rounded-full animate-spin" />
                    Création...
                  </>
                ) : (
                  "Créer la tâche"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
