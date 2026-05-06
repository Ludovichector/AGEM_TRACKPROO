"use client";

import { useRef, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import type { ChatMessage } from "./types";
import type { Role } from "@prisma/client";

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  currentUserRole: Role;
  onReply: (message: ChatMessage) => void;
  onReactionToggle: (messageId: string, emoji: string) => void;
  onPinToggle?: (messageId: string, willPin: boolean) => void;
  channelName: string;
}

export function MessageList({
  messages,
  currentUserId,
  currentUserRole,
  onReply,
  onReactionToggle,
  onPinToggle,
  channelName,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(messages.length);

  useEffect(() => {
    if (messages.length !== prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      prevLengthRef.current = messages.length;
    }
  }, [messages.length]);

  // Initial scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [channelName]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}
        >
          <MessageSquare className="w-7 h-7" style={{ color: "var(--agem-gold)" }} />
        </div>
        <div className="text-center">
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Bienvenue dans #{channelName}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            C'est le début de votre conversation. Soyez le premier à écrire !
          </p>
        </div>
      </div>
    );
  }

  // Group messages by date
  const groups = groupByDate(messages);

  return (
    <div className="flex-1 overflow-y-auto py-3">
      {groups.map(({ date, msgs }) => (
        <div key={date}>
          {/* Date separator */}
          <div className="flex items-center gap-3 px-5 my-3">
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
            <span
              className="text-xs px-3 py-0.5 rounded-full border font-medium"
              style={{
                color: "var(--text-muted)",
                borderColor: "var(--border-subtle)",
                backgroundColor: "var(--bg-elevated)",
              }}
            >
              {date}
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
          </div>

          {/* Messages of this day */}
          <div className="space-y-0.5">
            {msgs.map((msg, i) => {
              const prev = msgs[i - 1];
              const isConsecutive =
                !!prev &&
                prev.authorId === msg.authorId &&
                new Date(msg.createdAt).getTime() -
                  new Date(prev.createdAt).getTime() <
                  5 * 60 * 1000; // 5 min gap
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  isConsecutive={isConsecutive}
                  onReply={onReply}
                  onReactionToggle={onReactionToggle}
                  onPinToggle={onPinToggle}
                />
              );
            })}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function groupByDate(
  messages: ChatMessage[]
): { date: string; msgs: ChatMessage[] }[] {
  const groups: Record<string, ChatMessage[]> = {};
  for (const msg of messages) {
    const d = new Date(msg.createdAt);
    const now = new Date();
    let label: string;

    if (isSameDay(d, now)) {
      label = "Aujourd'hui";
    } else if (isSameDay(d, new Date(now.getTime() - 86400000))) {
      label = "Hier";
    } else {
      label = d.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(msg);
  }
  return Object.entries(groups).map(([date, msgs]) => ({ date, msgs }));
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
