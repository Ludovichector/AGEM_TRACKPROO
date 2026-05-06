"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SmilePlus, Reply, Pencil, Trash2, X, Pin, PinOff, Copy, Check,
} from "lucide-react";
import { ROLE_COLORS, ROLE_LABELS } from "@/lib/permissions";
import { toggleReaction, editMessage, deleteMessage, pinMessage, unpinMessage } from "@/server/actions/chat";
import type { ChatMessage } from "./types";
import type { Role } from "@prisma/client";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🎉", "🔥", "👀", "✅", "🚀", "👏", "💡", "⚠️", "📌"];

interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId: string;
  currentUserRole: Role;
  isConsecutive: boolean;
  onReply: (message: ChatMessage) => void;
  onReactionToggle: (messageId: string, emoji: string) => void;
  onPinToggle?: (messageId: string, isPinned: boolean) => void;
}

export function MessageBubble({
  message,
  currentUserId,
  currentUserRole,
  isConsecutive,
  onReply,
  onReactionToggle,
  onPinToggle,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isOwner = message.authorId === currentUserId;
  const canDelete =
    isOwner ||
    currentUserRole === "SUPER_ADMIN" ||
    currentUserRole === "AMOA_CHEF";
  const canEdit = isOwner;
  const canPin =
    currentUserRole === "SUPER_ADMIN" || currentUserRole === "AMOA_CHEF";

  const reactionGroups = message.reactions.reduce(
    (acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = [];
      acc[r.emoji].push(r);
      return acc;
    },
    {} as Record<string, typeof message.reactions>
  );

  const handleEdit = () => {
    startTransition(async () => {
      const res = await editMessage(message.id, editContent);
      if (res.success) setIsEditing(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteMessage(message.id);
    });
  };

  const handleReaction = (emoji: string) => {
    setShowEmojiPicker(false);
    onReactionToggle(message.id, emoji);
    startTransition(async () => {
      await toggleReaction(message.id, emoji);
    });
  };

  const handlePinToggle = () => {
    const willPin = !message.isPinned;
    onPinToggle?.(message.id, willPin);
    startTransition(async () => {
      if (willPin) {
        await pinMessage(message.id, message.channelId);
      } else {
        await unpinMessage(message.id);
      }
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const avatarInitials = message.author.fullName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const renderContent = (text: string) => {
    const parts = text.split(/(@\[[^\]]+\]\([^)]+\)|@here|@channel)/g);
    return parts.map((part, i) => {
      const mentionMatch = part.match(/@\[([^\]]+)\]\(([^)]+)\)/);
      if (mentionMatch) {
        return (
          <span
            key={i}
            className="font-semibold rounded px-0.5"
            style={{ color: "var(--agem-gold)", backgroundColor: "rgba(212,175,55,0.12)" }}
          >
            @{mentionMatch[1]}
          </span>
        );
      }
      if (part === "@here" || part === "@channel") {
        return (
          <span
            key={i}
            className="font-semibold rounded px-0.5"
            style={{ color: "#f59e0b", backgroundColor: "rgba(245,158,11,0.12)" }}
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex items-start gap-3 px-5 py-0.5 rounded-lg transition-colors"
      style={{
        backgroundColor: message.isPinned
          ? "rgba(212,175,55,0.04)"
          : showActions
          ? "var(--bg-elevated)"
          : "transparent",
        borderLeft: message.isPinned ? "2px solid rgba(212,175,55,0.3)" : "2px solid transparent",
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* Pin indicator */}
      {message.isPinned && (
        <div
          className="absolute top-1 right-12 flex items-center gap-1 text-xs"
          style={{ color: "rgba(212,175,55,0.6)" }}
        >
          <Pin className="w-2.5 h-2.5" />
        </div>
      )}

      {/* Avatar */}
      <div className="w-8 shrink-0 mt-0.5">
        {!isConsecutive ? (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: ROLE_COLORS[message.author.role] }}
            title={`${message.author.fullName} · ${ROLE_LABELS[message.author.role]}`}
          >
            {avatarInitials}
          </div>
        ) : (
          <span
            className="text-xs opacity-0 group-hover:opacity-100 transition-opacity select-none"
            style={{ color: "var(--text-muted)", fontSize: "10px", lineHeight: "32px" }}
          >
            {new Date(message.createdAt).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {!isConsecutive && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {message.author.fullName}
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)", fontSize: "11px" }}>
              {new Date(message.createdAt).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {message.editedAt && (
              <span className="text-xs italic" style={{ color: "var(--text-muted)", fontSize: "10px" }}>
                (modifié)
              </span>
            )}
          </div>
        )}

        {/* Edit form or content */}
        {isEditing ? (
          <div
            className="rounded-lg border p-2"
            style={{ borderColor: "var(--agem-gold)", backgroundColor: "var(--bg-elevated)" }}
          >
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={2}
              className="w-full bg-transparent text-sm outline-none resize-none"
              style={{ color: "var(--text-primary)" }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEdit(); }
                if (e.key === "Escape") setIsEditing(false);
              }}
            />
            <div className="flex items-center justify-end gap-2 mt-1.5">
              <button onClick={() => setIsEditing(false)} className="p-1 rounded hover:bg-black/10">
                <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              </button>
              <button
                onClick={handleEdit}
                disabled={isPending}
                className="px-2.5 py-1 rounded-md text-xs font-semibold"
                style={{ backgroundColor: "var(--agem-gold)", color: "var(--agem-black)" }}
              >
                Sauvegarder
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed break-words" style={{ color: "var(--text-primary)" }}>
            {renderContent(message.content)}
          </p>
        )}

        {/* Thread reply count */}
        {(message.replyCount ?? 0) > 0 && (
          <button
            onClick={() => onReply(message)}
            className="flex items-center gap-1.5 mt-1 text-xs font-medium transition-colors hover:underline"
            style={{ color: "var(--agem-gold-dark)" }}
          >
            <Reply className="w-3.5 h-3.5" />
            {message.replyCount} {message.replyCount === 1 ? "réponse" : "réponses"}
          </button>
        )}

        {/* Reactions */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {Object.entries(reactionGroups).map(([emoji, reactions]) => {
              const iMine = reactions.some((r) => r.userId === currentUserId);
              return (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-all hover:scale-105"
                  style={{
                    backgroundColor: iMine ? "rgba(212,175,55,0.15)" : "var(--bg-elevated)",
                    borderColor: iMine ? "var(--agem-gold)" : "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                  title={reactions.map((r) => r.user.fullName).join(", ")}
                >
                  <span>{emoji}</span>
                  <span>{reactions.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating action toolbar */}
      <AnimatePresence>
        {showActions && !isEditing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute -top-3 right-4 flex items-center gap-0.5 rounded-lg shadow-lg border px-1 py-1 z-10"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-subtle)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            }}
          >
            {/* Emoji picker */}
            <div className="relative">
              <ActionBtn
                icon={<SmilePlus className="w-4 h-4" />}
                label="Réagir"
                onClick={() => setShowEmojiPicker((v) => !v)}
              />
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute bottom-full right-0 mb-1 flex flex-wrap gap-0.5 rounded-xl border px-2 py-1.5 shadow-xl z-20"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border-subtle)",
                      maxWidth: "200px",
                    }}
                  >
                    {QUICK_EMOJIS.map((em) => (
                      <button
                        key={em}
                        onClick={() => handleReaction(em)}
                        className="text-base hover:scale-125 transition-transform p-0.5 rounded"
                      >
                        {em}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ActionBtn
              icon={<Reply className="w-4 h-4" />}
              label="Répondre en thread"
              onClick={() => onReply(message)}
            />

            <ActionBtn
              icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              label="Copier le texte"
              onClick={handleCopy}
            />

            {canPin && (
              <ActionBtn
                icon={message.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                label={message.isPinned ? "Désépingler" : "Épingler"}
                onClick={handlePinToggle}
              />
            )}

            {canEdit && (
              <ActionBtn
                icon={<Pencil className="w-4 h-4" />}
                label="Modifier"
                onClick={() => setIsEditing(true)}
              />
            )}

            {canDelete && (
              <ActionBtn
                icon={<Trash2 className="w-4 h-4" />}
                label="Supprimer"
                onClick={handleDelete}
                danger
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="p-1.5 rounded-md transition-colors hover:bg-black/10"
      style={{ color: danger ? "var(--status-danger)" : "var(--text-secondary)" }}
    >
      {icon}
    </button>
  );
}
