"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, UserPlus, UserMinus, Crown } from "lucide-react";
import { addChannelMember, removeChannelMember } from "@/server/actions/chat";
import { ROLE_COLORS, ROLE_LABELS } from "@/lib/permissions";
import type { ChatChannel, ChatUser } from "./types";

interface ManageMembersModalProps {
  channel: ChatChannel;
  allUsers: ChatUser[];
  currentUserId: string;
  onClose: () => void;
}

export function ManageMembersModal({
  channel,
  allUsers,
  currentUserId,
  onClose,
}: ManageMembersModalProps) {
  const [searchQ, setSearchQ] = useState("");
  const [isPending, startTransition] = useTransition();
  const [memberIds, setMemberIds] = useState<string[]>(channel.memberIds);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const members = allUsers.filter((u) => memberIds.includes(u.id));
  const nonMembers = allUsers.filter(
    (u) =>
      !memberIds.includes(u.id) &&
      u.fullName.toLowerCase().includes(searchQ.toLowerCase())
  );

  const handleAdd = (userId: string) => {
    startTransition(async () => {
      const res = await addChannelMember(channel.id, userId);
      if (res.success) {
        setMemberIds((prev) => [...prev, userId]);
        setFeedback({ type: "success", msg: "Membre ajouté avec succès." });
      } else {
        setFeedback({ type: "error", msg: res.error ?? "Erreur." });
      }
      setTimeout(() => setFeedback(null), 3000);
    });
  };

  const handleRemove = (userId: string) => {
    if (userId === currentUserId) return;
    startTransition(async () => {
      const res = await removeChannelMember(channel.id, userId);
      if (res.success) {
        setMemberIds((prev) => prev.filter((id) => id !== userId));
        setFeedback({ type: "success", msg: "Membre retiré." });
      } else {
        setFeedback({ type: "error", msg: res.error ?? "Erreur." });
      }
      setTimeout(() => setFeedback(null), 3000);
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
          className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
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
                Membres de #{channel.name}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                {memberIds.length} membre{memberIds.length > 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
            >
              <X className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Feedback */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor:
                      feedback.type === "success"
                        ? "rgba(16,185,129,0.1)"
                        : "rgba(239,68,68,0.1)",
                    color:
                      feedback.type === "success"
                        ? "var(--status-success)"
                        : "var(--status-danger)",
                    border: `1px solid ${
                      feedback.type === "success"
                        ? "rgba(16,185,129,0.2)"
                        : "rgba(239,68,68,0.2)"
                    }`,
                  }}
                >
                  {feedback.msg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Current members */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                Membres actuels
              </p>
              <div className="space-y-1">
                {members.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ backgroundColor: "var(--bg-elevated)" }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: ROLE_COLORS[user.role] }}
                    >
                      {user.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {user.fullName}
                        </p>
                        {user.id === currentUserId && (
                          <Crown className="w-3 h-3 shrink-0" style={{ color: "var(--agem-gold)" }} aria-label="Vous" />
                        )}
                      </div>
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                        {ROLE_LABELS[user.role]}
                      </p>
                    </div>
                    {user.id !== currentUserId && (
                      <button
                        onClick={() => handleRemove(user.id)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                        title="Retirer du canal"
                      >
                        <UserMinus className="w-4 h-4" style={{ color: "var(--status-danger)" }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Add members */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                Ajouter des membres
              </p>
              <div
                className="flex items-center gap-2 rounded-xl border px-3 py-2 mb-2"
                style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-elevated)" }}
              >
                <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Chercher un utilisateur…"
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {nonMembers.length === 0 ? (
                  <p className="text-sm text-center py-3" style={{ color: "var(--text-muted)" }}>
                    {searchQ ? "Aucun résultat" : "Tous les utilisateurs sont déjà membres"}
                  </p>
                ) : (
                  nonMembers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/[0.04] transition-colors"
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
                      <button
                        onClick={() => handleAdd(user.id)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg transition-colors hover:bg-green-50"
                        title="Ajouter au canal"
                      >
                        <UserPlus className="w-4 h-4" style={{ color: "var(--status-success)" }} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div
            className="px-6 py-4 border-t flex justify-end"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-elevated)" }}
          >
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ backgroundColor: "var(--agem-gold)", color: "var(--agem-black)" }}
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
