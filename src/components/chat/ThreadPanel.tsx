"use client";

import { useState, useEffect, useTransition } from "react";
import { motion } from "framer-motion";
import { X, MessageSquare } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { sendMessage } from "@/server/actions/chat";
import { ROLE_COLORS, ROLE_LABELS } from "@/lib/permissions";
import type { ChatMessage, ChatUser } from "./types";
import type { Role } from "@prisma/client";

interface ThreadPanelProps {
  parentMessage: ChatMessage;
  currentUserId: string;
  currentUserRole: Role;
  mentionableUsers: ChatUser[];
  onClose: () => void;
}

export function ThreadPanel({
  parentMessage,
  currentUserId,
  currentUserRole,
  mentionableUsers,
  onClose,
}: ThreadPanelProps) {
  const [replies, setReplies] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReplies = async () => {
    try {
      const res = await fetch(`/api/chat/threads?messageId=${parentMessage.id}`);
      const data = await res.json();
      setReplies(
        (data.replies ?? []).map((m: Record<string, unknown>) => ({
          ...m,
          createdAt:
            typeof m.createdAt === "string"
              ? m.createdAt
              : (m.createdAt as Date).toISOString?.() ?? String(m.createdAt),
          editedAt:
            m.editedAt != null
              ? typeof m.editedAt === "string"
                ? m.editedAt
                : (m.editedAt as Date).toISOString?.() ?? String(m.editedAt)
              : null,
        }))
      );
    } catch (err) {
      console.error("ThreadPanel fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReplies();
    const interval = setInterval(fetchReplies, 5000);
    return () => clearInterval(interval);
  }, [parentMessage.id]);

  const handleSendReply = async (content: string) => {
    await sendMessage(parentMessage.channelId, content, parentMessage.id);
    await fetchReplies();
  };

  const avatarInitials = parentMessage.author.fullName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex flex-col border-l"
      style={{
        width: 360,
        minWidth: 320,
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
          <MessageSquare className="w-4 h-4" style={{ color: "var(--agem-gold)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Thread
          </p>
          {replies.length > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(212,175,55,0.1)", color: "var(--agem-gold-dark)" }}
            >
              {replies.length}
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

      {/* Parent message */}
      <div
        className="px-4 py-4 border-b"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-elevated)" }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: ROLE_COLORS[parentMessage.author.role] }}
          >
            {avatarInitials}
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {parentMessage.author.fullName}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {new Date(parentMessage.createdAt).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="text-sm mt-0.5 leading-relaxed" style={{ color: "var(--text-primary)" }}>
              {parentMessage.content}
            </p>
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="flex-1 overflow-y-auto py-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--agem-gold)", borderTopColor: "transparent" }}
            />
          </div>
        ) : replies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 px-4 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Aucune réponse pour l'instant.
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Répondez à ce message pour démarrer le thread.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {replies.map((reply, i) => {
              const prev = replies[i - 1];
              const isConsecutive =
                !!prev &&
                prev.authorId === reply.authorId &&
                new Date(reply.createdAt).getTime() -
                  new Date(prev.createdAt).getTime() <
                  5 * 60 * 1000;
              return (
                <MessageBubble
                  key={reply.id}
                  message={reply}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  isConsecutive={isConsecutive}
                  onReply={() => {}} // No nested threads
                  onReactionToggle={() => {}}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Reply input */}
      <div className="shrink-0">
        <MessageInput
          channelName={`thread`}
          currentUserRole={currentUserRole}
          mentionableUsers={mentionableUsers}
          onSend={handleSendReply}
          placeholder="Répondre dans le thread…"
        />
      </div>
    </motion.div>
  );
}
