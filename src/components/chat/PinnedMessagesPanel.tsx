"use client";

import { useState, useEffect, useTransition } from "react";
import { motion } from "framer-motion";
import { X, Pin, PinOff, Loader2 } from "lucide-react";
import { unpinMessage } from "@/server/actions/chat";
import { ROLE_COLORS } from "@/lib/permissions";
import type { ChatMessage, PinnedMessage } from "./types";
import type { Role } from "@prisma/client";

interface PinnedMessagesPanelProps {
  channelId: string;
  channelName: string;
  currentUserRole: Role;
  onClose: () => void;
  onJumpTo: (message: ChatMessage) => void;
}

export function PinnedMessagesPanel({
  channelId,
  channelName,
  currentUserRole,
  onClose,
  onJumpTo,
}: PinnedMessagesPanelProps) {
  const [pinned, setPinned] = useState<PinnedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const canUnpin =
    currentUserRole === "SUPER_ADMIN" || currentUserRole === "AMOA_CHEF";

  const fetchPinned = async () => {
    try {
      const res = await fetch(`/api/chat/pinned?channelId=${channelId}`);
      const data = await res.json();
      setPinned(
        (data.pinned ?? []).map(
          (p: Record<string, unknown>) => ({
            ...p,
            pinnedAt:
              typeof p.pinnedAt === "string"
                ? p.pinnedAt
                : new Date(p.pinnedAt as string).toISOString(),
            message: {
              ...(p.message as Record<string, unknown>),
              createdAt:
                typeof (p.message as Record<string, unknown>).createdAt === "string"
                  ? (p.message as Record<string, unknown>).createdAt
                  : new Date(
                      (p.message as Record<string, unknown>).createdAt as string
                    ).toISOString(),
              reactions:
                Array.isArray((p.message as Record<string, unknown>).reactions)
                  ? (p.message as Record<string, unknown>).reactions
                  : [],
              replyCount:
                typeof (p.message as Record<string, unknown>)._count === "object" &&
                (p.message as Record<string, unknown>)._count !== null
                  ? ((p.message as Record<string, unknown>)._count as { replies: number }).replies
                  : 0,
            },
          })
        )
      );
    } catch (err) {
      console.error("PinnedMessagesPanel fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPinned();
  }, [channelId]);

  const handleUnpin = (messageId: string) => {
    startTransition(async () => {
      const res = await unpinMessage(messageId);
      if (res.success) {
        setPinned((prev) => prev.filter((p) => p.messageId !== messageId));
      }
    });
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex flex-col border-l shrink-0"
      style={{
        width: 340,
        borderColor: "var(--border-subtle)",
        backgroundColor: "var(--bg-card)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3.5 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2">
          <Pin className="w-4 h-4" style={{ color: "var(--agem-gold)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Messages épinglés
          </p>
          {pinned.length > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: "rgba(212,175,55,0.12)", color: "var(--agem-gold-dark)" }}
            >
              {pinned.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
        >
          <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
        </button>
      </div>

      {/* Channel label */}
      <div
        className="px-4 py-2 text-xs border-b"
        style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
      >
        Canal : <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>#{channelName}</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--agem-gold)" }} />
          </div>
        ) : pinned.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(212,175,55,0.08)" }}
            >
              <Pin className="w-6 h-6" style={{ color: "var(--agem-gold)", opacity: 0.5 }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Aucun message épinglé
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Épinglez un message pour le retrouver facilement ici
              </p>
            </div>
          </div>
        ) : (
          <div className="py-2">
            {pinned.map((pin) => {
              const msg = pin.message;
              const initials = msg.author.fullName
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div
                  key={pin.id}
                  className="mx-3 my-1.5 rounded-xl border overflow-hidden"
                  style={{
                    borderColor: "var(--border-subtle)",
                    backgroundColor: "var(--bg-elevated)",
                  }}
                >
                  {/* Pin meta */}
                  <div
                    className="px-3 py-1.5 flex items-center gap-2 border-b"
                    style={{
                      borderColor: "rgba(212,175,55,0.2)",
                      backgroundColor: "rgba(212,175,55,0.05)",
                    }}
                  >
                    <Pin className="w-3 h-3" style={{ color: "var(--agem-gold)" }} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Épinglé par{" "}
                      <span style={{ color: "var(--agem-gold-dark)", fontWeight: 600 }}>
                        {pin.pinnedBy.fullName}
                      </span>{" "}
                      · {new Date(pin.pinnedAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>

                  {/* Message content */}
                  <div className="p-3">
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: ROLE_COLORS[msg.author.role] }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                            {msg.author.fullName}
                          </span>
                          <span className="text-xs" style={{ color: "var(--text-muted)", fontSize: "10px" }}>
                            {new Date(msg.createdAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p
                          className="text-sm mt-0.5 line-clamp-3 leading-relaxed"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="px-3 py-2 border-t flex items-center justify-between"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <button
                      onClick={() => onJumpTo(msg)}
                      className="text-xs font-medium transition-colors hover:underline"
                      style={{ color: "var(--agem-gold-dark)" }}
                    >
                      Aller au message →
                    </button>
                    {canUnpin && (
                      <button
                        onClick={() => handleUnpin(msg.id)}
                        disabled={isPending}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors hover:bg-red-50"
                        style={{ color: "var(--status-danger)" }}
                        title="Désépingler"
                      >
                        <PinOff className="w-3 h-3" />
                        <span>Désépingler</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
