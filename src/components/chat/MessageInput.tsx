"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Send, Paperclip, AtSign, AlertCircle } from "lucide-react";
import type { ChatUser } from "./types";
import type { Role } from "@prisma/client";

interface MessageInputProps {
  channelName: string;
  currentUserRole: Role;
  mentionableUsers: ChatUser[];
  onSend: (content: string) => Promise<void>;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
  replyToId?: string;
  replyToAuthor?: string;
  onCancelReply?: () => void;
}

export function MessageInput({
  channelName,
  currentUserRole,
  mentionableUsers,
  onSend,
  onTyping,
  disabled = false,
  placeholder,
  replyToId,
  replyToAuthor,
  onCancelReply,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 150)}px`;
  }, [content]);

  // Focus when replying
  useEffect(() => {
    if (replyToId) textareaRef.current?.focus();
  }, [replyToId]);

  const filteredMentions =
    mentionSearch !== null
      ? mentionableUsers.filter((u) =>
          u.fullName.toLowerCase().includes(mentionSearch.toLowerCase())
        )
      : [];

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    onTyping?.();

    // Detect @ mention
    const cursor = e.target.selectionStart;
    const before = val.slice(0, cursor);
    const atIdx = before.lastIndexOf("@");

    if (atIdx !== -1 && !before.slice(atIdx + 1).includes(" ")) {
      setMentionSearch(before.slice(atIdx + 1));
      setMentionStart(atIdx);
    } else {
      setMentionSearch(null);
    }
  };

  const insertMention = (user: ChatUser) => {
    const mentionText = `@[${user.fullName}](${user.id})`;
    const before = content.slice(0, mentionStart);
    const after = content.slice(mentionStart + 1 + (mentionSearch?.length ?? 0));
    const newContent = before + mentionText + " " + after;
    setContent(newContent);
    setMentionSearch(null);
    textareaRef.current?.focus();
  };

  const handleSend = () => {
    const text = content.trim();
    if (!text || disabled || isPending) return;

    setContent("");
    startTransition(async () => {
      await onSend(text);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionSearch !== null && filteredMentions.length > 0) {
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionSearch(null);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isReadOnly = currentUserRole === "OBSERVATEUR" || disabled;

  if (isReadOnly) {
    return (
      <div
        className="p-4 border-t"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
      >
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
        >
          <AlertCircle className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Les observateurs ne peuvent pas envoyer de messages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-4 border-t shrink-0"
      style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
    >
      {/* Reply banner */}
      {replyToId && replyToAuthor && (
        <div
          className="flex items-center justify-between px-3 py-1.5 rounded-t-lg mb-0 -mx-0 text-xs"
          style={{
            backgroundColor: "rgba(212,175,55,0.08)",
            borderLeft: "2px solid var(--agem-gold)",
            marginBottom: "-2px",
          }}
        >
          <span style={{ color: "var(--text-muted)" }}>
            Réponse à <span style={{ color: "var(--agem-gold-dark)", fontWeight: 600 }}>{replyToAuthor}</span>
          </span>
          <button
            onClick={onCancelReply}
            className="text-xs px-1 rounded hover:bg-black/10"
            style={{ color: "var(--text-muted)" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Mention dropdown */}
      {mentionSearch !== null && filteredMentions.length > 0 && (
        <div
          className="absolute bottom-full left-4 right-4 mb-1 rounded-xl border shadow-xl z-20 overflow-hidden"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-subtle)",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.12)",
          }}
        >
          <div className="px-3 py-2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Membres du canal
          </div>
          {filteredMentions.slice(0, 6).map((user) => (
            <button
              key={user.id}
              onClick={() => insertMention(user)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-black/[0.04] transition-colors"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: "#C9A961" }}
              >
                {user.fullName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {user.fullName}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Input box */}
      <div
        className="relative flex items-end gap-2 rounded-xl px-3 py-2.5"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1.5px solid var(--border-subtle)",
          transition: "border-color 0.2s",
        }}
        onFocus={() => {}}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? `Message dans #${channelName}…`}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed"
          style={{
            color: "var(--text-primary)",
            minHeight: "24px",
            maxHeight: "150px",
          }}
        />
        <div className="flex items-center gap-1 shrink-0">
          <button
            title="@Mention"
            className="p-1.5 rounded-lg transition-colors hover:bg-black/10"
            style={{ color: "var(--text-muted)" }}
            onClick={() => {
              setContent((c) => c + "@");
              setMentionSearch("");
              setMentionStart(content.length);
              textareaRef.current?.focus();
            }}
          >
            <AtSign className="w-4 h-4" />
          </button>
          <button
            onClick={handleSend}
            disabled={!content.trim() || isPending}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{
              backgroundColor: content.trim() && !isPending ? "var(--agem-gold)" : "var(--border-subtle)",
              color: content.trim() && !isPending ? "var(--agem-black)" : "var(--text-muted)",
              transform: content.trim() ? "scale(1.05)" : "scale(1)",
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-xs mt-1.5 ml-1" style={{ color: "var(--text-muted)" }}>
        <kbd className="px-1 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: "var(--bg-elevated)" }}>
          Entrée
        </kbd>{" "}
        pour envoyer ·{" "}
        <kbd className="px-1 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: "var(--bg-elevated)" }}>
          Shift+Entrée
        </kbd>{" "}
        pour nouvelle ligne ·{" "}
        <kbd className="px-1 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: "var(--bg-elevated)" }}>
          @
        </kbd>{" "}
        pour mentionner
      </p>
    </div>
  );
}
