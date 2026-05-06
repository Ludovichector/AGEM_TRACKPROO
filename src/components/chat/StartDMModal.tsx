"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, MessageSquarePlus } from "lucide-react";
import { getOrCreateDM } from "@/server/actions/chat";
import { ROLE_COLORS, ROLE_LABELS } from "@/lib/permissions";
import { PRESENCE_COLORS } from "./types";
import type { ChatUser, UserPresence } from "./types";

interface StartDMModalProps {
  users: ChatUser[];
  currentUserId: string;
  presences: Record<string, UserPresence>;
  onClose: () => void;
  onDMCreated: (channelId: string) => void;
}

export function StartDMModal({
  users,
  currentUserId,
  presences,
  onClose,
  onDMCreated,
}: StartDMModalProps) {
  const [searchQ, setSearchQ] = useState("");
  const [isPending, startTransition] = useTransition();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filtered = users.filter(
    (u) =>
      u.id !== currentUserId &&
      u.fullName.toLowerCase().includes(searchQ.toLowerCase())
  );

  const handleSelect = (userId: string) => {
    setPendingUserId(userId);
    setError("");
    startTransition(async () => {
      const res = await getOrCreateDM(userId);
      if (res.success && res.channelId) {
        onDMCreated(res.channelId);
      } else {
        setError(res.error ?? "Erreur lors de l'ouverture du DM.");
      }
      setPendingUserId(null);
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
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(212,175,55,0.12)" }}
              >
                <MessageSquarePlus className="w-5 h-5" style={{ color: "var(--agem-gold)" }} />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  Nouveau message direct
                </h2>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Commencez une conversation privée
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
            >
              <X className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <div
              className="flex items-center gap-2.5 rounded-xl border px-3 py-2.5"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-elevated)" }}
            >
              <Search className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Rechercher un membre…"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--text-primary)" }}
                autoFocus
              />
            </div>
          </div>

          {/* User list */}
          <div className="max-h-72 overflow-y-auto py-2">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                Aucun membre trouvé
              </div>
            ) : (
              filtered.map((user) => {
                const presence = presences[user.id];
                const status = presence?.status ?? "offline";
                const isLoading = isPending && pendingUserId === user.id;

                return (
                  <button
                    key={user.id}
                    onClick={() => handleSelect(user.id)}
                    disabled={isPending}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-black/[0.04]"
                  >
                    {/* Avatar with presence */}
                    <div className="relative shrink-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ backgroundColor: ROLE_COLORS[user.role] }}
                      >
                        {user.fullName.charAt(0)}
                      </div>
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                        style={{
                          backgroundColor: PRESENCE_COLORS[status],
                          borderColor: "var(--bg-card)",
                        }}
                      />
                    </div>

                    {/* Name + role */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {user.fullName}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                        {ROLE_LABELS[user.role]}
                      </p>
                    </div>

                    {/* Loading or arrow */}
                    {isLoading ? (
                      <div
                        className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                        style={{ borderColor: "var(--agem-gold)", borderTopColor: "transparent" }}
                      />
                    ) : (
                      <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                        →
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {error && (
            <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <p className="text-sm" style={{ color: "var(--status-danger)" }}>{error}</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
