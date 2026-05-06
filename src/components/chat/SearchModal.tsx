"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Hash, MessageSquare, Loader2 } from "lucide-react";
import { ROLE_COLORS } from "@/lib/permissions";
import type { ChatMessage } from "./types";

interface SearchResult extends ChatMessage {
  channel: { id: string; name: string; isDM: boolean };
  replyCount: number;
}

interface SearchModalProps {
  onClose: () => void;
  onJumpTo: (channelId: string, message: ChatMessage) => void;
}

export function SearchModal({ onClose, onJumpTo }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/chat/search?q=${encodeURIComponent(query.trim())}`
        );
        const data = await res.json();
        setResults(
          (data.messages ?? []).map((m: Record<string, unknown>) => ({
            ...m,
            createdAt:
              typeof m.createdAt === "string"
                ? m.createdAt
                : new Date(m.createdAt as string).toISOString(),
            reactions: Array.isArray(m.reactions) ? m.reactions : [],
            replyCount:
              typeof m._count === "object" && m._count !== null
                ? (m._count as { replies: number }).replies
                : 0,
          }))
        );
      } catch (err) {
        console.error("SearchModal error:", err);
      } finally {
        setIsLoading(false);
        setSearched(true);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          style={{
            backgroundColor: "rgba(212,175,55,0.25)",
            color: "var(--agem-gold-dark)",
            borderRadius: "2px",
            padding: "0 1px",
          }}
        >
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
        style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search bar */}
          <div
            className="flex items-center gap-3 px-5 py-4 border-b"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 shrink-0 animate-spin" style={{ color: "var(--agem-gold)" }} />
            ) : (
              <Search className="w-5 h-5 shrink-0" style={{ color: "var(--text-muted)" }} />
            )}
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher dans tous les canaux…"
              className="flex-1 bg-transparent text-base outline-none"
              style={{ color: "var(--text-primary)" }}
              onKeyDown={(e) => e.key === "Escape" && onClose()}
            />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/10 transition-colors shrink-0"
            >
              <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {!query.trim() ? (
              <div className="py-10 text-center">
                <Search className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Tapez pour rechercher dans les messages
                </p>
              </div>
            ) : searched && results.length === 0 ? (
              <div className="py-10 text-center">
                <MessageSquare className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  Aucun résultat pour « {query} »
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Essayez d'autres termes de recherche
                </p>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                <div className="px-5 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {results.length} résultat{results.length > 1 ? "s" : ""}
                </div>
                {results.map((msg) => {
                  const initials = msg.author.fullName
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <button
                      key={msg.id}
                      onClick={() => {
                        onJumpTo(msg.channel.id, msg);
                        onClose();
                      }}
                      className="w-full flex items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-black/[0.04]"
                    >
                      {/* Avatar */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
                        style={{ backgroundColor: ROLE_COLORS[msg.author.role] }}
                      >
                        {initials}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                            {msg.author.fullName}
                          </span>
                          <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                            <Hash className="w-3 h-3" />
                            {msg.channel.name}
                          </span>
                          <span className="text-xs ml-auto" style={{ color: "var(--text-muted)", fontSize: "10px" }}>
                            {new Date(msg.createdAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p
                          className="text-sm leading-relaxed line-clamp-2"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {highlightMatch(msg.content, query)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Footer hint */}
          <div
            className="px-5 py-2.5 border-t text-xs flex items-center gap-4"
            style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
          >
            <span>
              <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: "var(--bg-elevated)" }}>↵</kbd>
              {" "}aller au message
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: "var(--bg-elevated)" }}>Esc</kbd>
              {" "}fermer
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
