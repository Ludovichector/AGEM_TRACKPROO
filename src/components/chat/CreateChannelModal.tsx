"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Hash, Plus, Minus, Search, Users } from "lucide-react";
import { createChannel } from "@/server/actions/chat";
import { ROLE_COLORS, ROLE_LABELS } from "@/lib/permissions";
import type { ChatUser } from "./types";

interface CreateChannelModalProps {
  users: ChatUser[];
  currentUserId: string;
  onClose: () => void;
  onCreated: (channelId: string) => void;
}

export function CreateChannelModal({
  users,
  currentUserId,
  onClose,
  onCreated,
}: CreateChannelModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([currentUserId]);
  const [searchQ, setSearchQ] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredUsers = users.filter(
    (u) =>
      u.id !== currentUserId &&
      u.fullName.toLowerCase().includes(searchQ.toLowerCase())
  );

  const toggleUser = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    const sanitizedName = name.trim().toLowerCase().replace(/\s+/g, "-");
    if (!sanitizedName) {
      setError("Le nom du canal est requis.");
      return;
    }
    if (!/^[a-z0-9-_]+$/.test(sanitizedName)) {
      setError("Utilisez uniquement des lettres, chiffres et tirets.");
      return;
    }

    setError("");
    startTransition(async () => {
      const res = await createChannel({
        name: sanitizedName,
        description: description.trim() || undefined,
        isPrivate,
        memberIds: selectedIds,
      });

      if (res.success && res.channelId) {
        onCreated(res.channelId);
      } else {
        setError(res.error ?? "Erreur inconnue.");
      }
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="px-6 py-5 border-b flex items-center justify-between"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div>
              <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                Créer un canal
              </h2>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                Les canaux permettent de regrouper les conversations par thème
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
            >
              <X className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Name */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "var(--text-muted)" }}>
                Nom du canal
              </label>
              <div
                className="flex items-center gap-2 rounded-xl border px-3 py-2.5"
                style={{ borderColor: error && !name.trim() ? "var(--status-danger)" : "var(--border-subtle)", backgroundColor: "var(--bg-elevated)" }}
              >
                <Hash className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  placeholder="ex: general, technique, finances"
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--text-primary)" }}
                  autoFocus
                />
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Lettres minuscules, chiffres et tirets uniquement
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "var(--text-muted)" }}>
                Description <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optionnel)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="À quoi sert ce canal ?"
                rows={2}
                className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none resize-none"
                style={{
                  borderColor: "var(--border-subtle)",
                  backgroundColor: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Privacy toggle */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "var(--text-muted)" }}>
                Visibilité
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    value: false,
                    icon: <Hash className="w-4 h-4" />,
                    label: "Public",
                    desc: "Visible par tous les membres",
                  },
                  {
                    value: true,
                    icon: <Lock className="w-4 h-4" />,
                    label: "Privé",
                    desc: "Accessible sur invitation seulement",
                  },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setIsPrivate(opt.value)}
                    className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                    style={{
                      borderColor:
                        isPrivate === opt.value ? "var(--agem-gold)" : "var(--border-subtle)",
                      backgroundColor:
                        isPrivate === opt.value
                          ? "rgba(212,175,55,0.08)"
                          : "var(--bg-elevated)",
                    }}
                  >
                    <div style={{ color: isPrivate === opt.value ? "var(--agem-gold)" : "var(--text-muted)" }}>
                      {opt.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {opt.label}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Members */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "var(--text-muted)" }}>
                Membres ({selectedIds.length} sélectionné{selectedIds.length > 1 ? "s" : ""})
              </label>
              <div
                className="flex items-center gap-2 rounded-xl border px-3 py-2 mb-2"
                style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-elevated)" }}
              >
                <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Rechercher un utilisateur…"
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>
              <div
                className="max-h-48 overflow-y-auto rounded-xl border"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                {filteredUsers.map((user, i) => {
                  const isSelected = selectedIds.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleUser(user.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-black/[0.04]"
                      style={{
                        borderTop: i > 0 ? "1px solid var(--border-subtle)" : "none",
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: ROLE_COLORS[user.role] }}
                      >
                        {user.fullName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {user.fullName}
                        </p>
                        <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                          {ROLE_LABELS[user.role]}
                        </p>
                      </div>
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center border transition-all"
                        style={{
                          backgroundColor: isSelected ? "var(--agem-gold)" : "transparent",
                          borderColor: isSelected ? "var(--agem-gold)" : "var(--border-strong)",
                        }}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-black" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <div className="px-3 py-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    Aucun utilisateur trouvé
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm" style={{ color: "var(--status-danger)" }}>
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div
            className="px-6 py-4 border-t flex items-center justify-end gap-3"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-elevated)" }}
          >
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-black/10"
              style={{ color: "var(--text-secondary)" }}
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending || !name.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: name.trim() && !isPending ? "var(--agem-gold)" : "var(--border-subtle)",
                color: name.trim() && !isPending ? "var(--agem-black)" : "var(--text-muted)",
              }}
            >
              {isPending ? "Création…" : "Créer le canal"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
