"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Hash, Lock, X, Pin, Search as SearchIcon, MessageSquare } from "lucide-react";
import { hasPermission, ROLE_COLORS, ROLE_LABELS } from "@/lib/permissions";
import {
  sendMessage, markChannelRead, updatePresence,
} from "@/server/actions/chat";
import type { Role } from "@prisma/client";

import { ChannelSidebar } from "./ChannelSidebar";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ThreadPanel } from "./ThreadPanel";
import { CreateChannelModal } from "./CreateChannelModal";
import { ManageMembersModal } from "./ManageMembersModal";
import { StartDMModal } from "./StartDMModal";
import { PinnedMessagesPanel } from "./PinnedMessagesPanel";
import { SearchModal } from "./SearchModal";
import type { ChatChannel, ChatMessage, ChatUser, UserPresence } from "./types";
import { PRESENCE_COLORS } from "./types";

interface ChatPageClientProps {
  initialChannels: ChatChannel[];
  initialMessages: Record<string, ChatMessage[]>;
  currentUser: ChatUser & { role: Role };
  allUsers: ChatUser[];
  initialUnreadCounts: Record<string, number>;
}

export function ChatPageClient({
  initialChannels,
  initialMessages,
  currentUser,
  allUsers,
  initialUnreadCounts,
}: ChatPageClientProps) {
  const [channels, setChannels] = useState<ChatChannel[]>(initialChannels);
  const [activeChannelId, setActiveChannelId] = useState<string>(
    initialChannels[0]?.id ?? ""
  );
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(initialMessages);

  // UI State
  const [threadMessage, setThreadMessage] = useState<ChatMessage | null>(null);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDMModal, setShowDMModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [managingChannelId, setManagingChannelId] = useState<string | null>(null);

  // Presence & unread
  const [presences, setPresences] = useState<Record<string, UserPresence>>({});
  const [currentUserPresence, setCurrentUserPresence] = useState<UserPresence | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(initialUnreadCounts);

  // Typing indicators
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const canAdmin = hasPermission(currentUser.role, "chat", "delete");
  const activeChannel = channels.find((c) => c.id === activeChannelId) ?? null;
  const activeMessages = messages[activeChannelId] ?? [];
  const managingChannel = channels.find((c) => c.id === managingChannelId) ?? null;

  // =====================================================
  // KEYBOARD SHORTCUT: ⌘K for search
  // =====================================================
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // =====================================================
  // PRESENCE HEARTBEAT (every 60s)
  // =====================================================
  useEffect(() => {
    const sendHeartbeat = () => {
      fetch("/api/chat/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: currentUserPresence?.status ?? "online" }),
      }).catch(() => {});
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 60_000);
    return () => clearInterval(interval);
  }, [currentUserPresence?.status]);

  // =====================================================
  // POLLING
  // =====================================================

  const pollMessages = useCallback(async () => {
    if (!activeChannelId) return;
    const lastMsg = activeMessages[activeMessages.length - 1];
    const after = lastMsg?.createdAt ?? "";
    try {
      const res = await fetch(
        `/api/chat/messages?channelId=${activeChannelId}${after ? `&after=${encodeURIComponent(after)}` : ""}`
      );
      const data = await res.json();
      if (!data.messages?.length) return;

      const newMsgs: ChatMessage[] = data.messages.map(
        (m: Record<string, unknown>) => ({
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
          reactions: Array.isArray(m.reactions)
            ? m.reactions.map((r: Record<string, unknown>) => ({
                id: r.id, emoji: r.emoji, userId: r.userId, user: r.user,
              }))
            : [],
          replyCount:
            typeof m._count === "object" && m._count !== null && "replies" in (m._count as object)
              ? (m._count as { replies: number }).replies
              : 0,
        })
      );

      setMessages((prev) => {
        const existing = prev[activeChannelId] ?? [];
        const existingIds = new Set(existing.map((m) => m.id));
        const incoming = newMsgs.filter((m) => !existingIds.has(m.id));
        if (!incoming.length) return prev;
        return { ...prev, [activeChannelId]: [...existing, ...incoming] };
      });
    } catch (err) {
      console.error("Poll messages error:", err);
    }
  }, [activeChannelId, activeMessages]);

  const pollChannels = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/channels");
      const data = await res.json();
      if (!data.channels) return;

      const updated: ChatChannel[] = data.channels.map(
        (ch: Record<string, unknown>) => ({
          id: ch.id,
          name: ch.name,
          description: ch.description ?? null,
          isPrivate: ch.isPrivate,
          isDM: ch.isDM ?? false,
          memberIds: Array.isArray(ch.members)
            ? ch.members.map((m: { userId: string }) => m.userId)
            : [],
          memberCount: Array.isArray(ch.members) ? ch.members.length : 0,
          isMuted: Array.isArray(ch.members)
            ? Boolean(
                (ch.members as { userId: string; isMuted?: boolean }[]).find(
                  (m) => m.userId === currentUser.id
                )?.isMuted
              )
            : false,
        })
      );
      setChannels(updated);
    } catch (err) {
      console.error("Channel poll error:", err);
    }
  }, [currentUser.id]);

  const pollUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/unread");
      const data = await res.json();
      if (data.unreadCounts) {
        setUnreadCounts((prev) => ({
          ...prev,
          ...data.unreadCounts,
          [activeChannelId]: 0, // active channel always 0
        }));
      }
    } catch {}
  }, [activeChannelId]);

  const pollPresences = useCallback(async () => {
    const userIds = allUsers.map((u) => u.id).join(",");
    if (!userIds) return;
    try {
      const res = await fetch(`/api/chat/presence?userIds=${userIds}`);
      const data = await res.json();
      if (data.presences) {
        const map: Record<string, UserPresence> = {};
        for (const p of data.presences) map[p.userId] = p;
        setPresences(map);
      }
    } catch {}
  }, [allUsers]);

  const pollTyping = useCallback(async () => {
    if (!activeChannelId) return;
    try {
      const res = await fetch(`/api/chat/typing?channelId=${activeChannelId}`);
      const data = await res.json();
      setTypingUsers(data.typing ?? []);
    } catch {}
  }, [activeChannelId]);

  useEffect(() => {
    const msgInterval = setInterval(pollMessages, 3000);
    const chInterval = setInterval(pollChannels, 15000);
    const unreadInterval = setInterval(pollUnread, 10000);
    const presenceInterval = setInterval(pollPresences, 30000);
    const typingInterval = setInterval(pollTyping, 2000);

    pollPresences();

    return () => {
      clearInterval(msgInterval);
      clearInterval(chInterval);
      clearInterval(unreadInterval);
      clearInterval(presenceInterval);
      clearInterval(typingInterval);
    };
  }, [pollMessages, pollChannels, pollUnread, pollPresences, pollTyping]);

  // Mark as read when switching channels
  useEffect(() => {
    if (!activeChannelId) return;
    setUnreadCounts((prev) => ({ ...prev, [activeChannelId]: 0 }));
    setThreadMessage(null);
    setShowMembersPanel(false);
    setShowPinnedPanel(false);
    markChannelRead(activeChannelId).catch(() => {});
  }, [activeChannelId]);

  // =====================================================
  // TYPING INDICATOR
  // =====================================================

  const sendTypingIndicator = useCallback(
    async (typing: boolean) => {
      await fetch("/api/chat/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: activeChannelId, isTyping: typing }),
      }).catch(() => {});
    },
    [activeChannelId]
  );

  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTypingIndicator(true);
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTypingIndicator(false);
    }, 3000);
  }, [sendTypingIndicator]);

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleSend = async (content: string) => {
    isTypingRef.current = false;
    sendTypingIndicator(false);

    const optimistic: ChatMessage = {
      id: `opt-${Date.now()}`,
      content,
      authorId: currentUser.id,
      author: currentUser,
      channelId: activeChannelId,
      createdAt: new Date().toISOString(),
      reactions: [],
      replyCount: 0,
    };
    setMessages((prev) => ({
      ...prev,
      [activeChannelId]: [...(prev[activeChannelId] ?? []), optimistic],
    }));

    const res = await sendMessage(activeChannelId, content);
    if (res.success && res.message) {
      const msg = res.message;
      const realMsg: ChatMessage = {
        id: msg.id,
        content: msg.content,
        authorId: msg.authorId,
        author: msg.author as ChatUser,
        channelId: msg.channelId,
        parentMessageId: msg.parentMessageId ?? null,
        createdAt: msg.createdAt instanceof Date
          ? msg.createdAt.toISOString()
          : String(msg.createdAt),
        editedAt: msg.editedAt
          ? msg.editedAt instanceof Date
            ? msg.editedAt.toISOString()
            : String(msg.editedAt)
          : null,
        reactions: (msg.reactions ?? []).map((r) => ({
          id: r.id,
          emoji: r.emoji,
          userId: r.userId,
          user: r.user as { id: string; fullName: string },
        })),
        replyCount: 0,
      };
      setMessages((prev) => ({
        ...prev,
        [activeChannelId]: (prev[activeChannelId] ?? []).map((m) =>
          m.id === optimistic.id ? realMsg : m
        ),
      }));
    }
  };

  const handleReactionToggle = (messageId: string, emoji: string) => {
    setMessages((prev) => ({
      ...prev,
      [activeChannelId]: (prev[activeChannelId] ?? []).map((m) => {
        if (m.id !== messageId) return m;
        const existingIdx = m.reactions.findIndex(
          (r) => r.emoji === emoji && r.userId === currentUser.id
        );
        let newReactions = [...m.reactions];
        if (existingIdx >= 0) {
          newReactions.splice(existingIdx, 1);
        } else {
          newReactions = [
            ...newReactions,
            {
              id: `opt-${Date.now()}`,
              emoji,
              userId: currentUser.id,
              user: { id: currentUser.id, fullName: currentUser.fullName },
            },
          ];
        }
        return { ...m, reactions: newReactions };
      }),
    }));
  };

  const handlePinToggle = (messageId: string, willPin: boolean) => {
    setMessages((prev) => ({
      ...prev,
      [activeChannelId]: (prev[activeChannelId] ?? []).map((m) =>
        m.id === messageId ? { ...m, isPinned: willPin } : m
      ),
    }));
  };

  const handleChannelCreated = (channelId: string) => {
    setShowCreateModal(false);
    pollChannels().then(() => setActiveChannelId(channelId));
  };

  const loadChannelMessages = async (channelId: string) => {
    if (messages[channelId]) return;
    try {
      const res = await fetch(`/api/chat/messages?channelId=${channelId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages((prev) => ({
          ...prev,
          [channelId]: data.messages.map((m: Record<string, unknown>) => ({
            ...m,
            createdAt: typeof m.createdAt === "string"
              ? m.createdAt
              : new Date(m.createdAt as string).toISOString(),
            reactions: Array.isArray(m.reactions) ? m.reactions : [],
            replyCount:
              typeof m._count === "object" && m._count !== null
                ? (m._count as { replies: number }).replies
                : 0,
          })),
        }));
      }
    } catch {}
  };

  const handleDMCreated = (channelId: string) => {
    setShowDMModal(false);
    pollChannels().then(async () => {
      await loadChannelMessages(channelId);
      setActiveChannelId(channelId);
    });
  };

  const handleSelectChannel = (channelId: string) => {
    setActiveChannelId(channelId);
    loadChannelMessages(channelId);
  };

  const handlePresenceChange = async (status: UserPresence["status"]) => {
    setCurrentUserPresence({ userId: currentUser.id, status });
    await updatePresence(status);
  };

  const handleJumpToMessage = (channelId: string, _message: ChatMessage) => {
    handleSelectChannel(channelId);
  };

  // =====================================================
  // RENDER HELPERS
  // =====================================================

  const mentionableUsers = allUsers.filter(
    (u) => activeChannel?.memberIds.includes(u.id) ?? false
  );

  const typingUserNames = typingUsers
    .map((id) => allUsers.find((u) => u.id === id)?.fullName?.split(" ")[0])
    .filter(Boolean)
    .slice(0, 3) as string[];

  const dmPeerId = activeChannel?.isDM
    ? activeChannel.memberIds.find((id) => id !== currentUser.id)
    : null;
  const dmPeer = dmPeerId ? allUsers.find((u) => u.id === dmPeerId) : null;
  const dmPeerPresence = dmPeerId ? presences[dmPeerId] : null;

  return (
    <div className="flex h-full" style={{ minHeight: 0 }}>
      {/* Sidebar */}
      <ChannelSidebar
        channels={channels}
        activeChannelId={activeChannelId}
        currentUserId={currentUser.id}
        currentUserRole={currentUser.role}
        currentUserName={currentUser.fullName}
        currentUserPresence={currentUserPresence}
        allUsers={allUsers}
        presences={presences}
        onSelectChannel={handleSelectChannel}
        onCreateChannel={() => setShowCreateModal(true)}
        onManageMembers={(id) => setManagingChannelId(id)}
        onStartDM={() => setShowDMModal(true)}
        onOpenSearch={() => setShowSearchModal(true)}
        onPresenceChange={handlePresenceChange}
        onChannelDeleted={(id) => {
          setChannels((prev) => prev.filter((c) => c.id !== id));
          if (activeChannelId === id) {
            const remaining = channels.filter((c) => c.id !== id);
            setActiveChannelId(remaining[0]?.id ?? "");
          }
        }}
        unreadCounts={unreadCounts}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeChannel ? (
          <>
            {/* Channel header */}
            <div
              className="px-5 py-3 border-b flex items-center gap-3 shrink-0"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {activeChannel.isDM ? (
                  <div className="relative shrink-0">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: dmPeer ? ROLE_COLORS[dmPeer.role] : "#888" }}
                    >
                      {dmPeer?.fullName.charAt(0) ?? "?"}
                    </div>
                    {dmPeerPresence && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border"
                        style={{
                          backgroundColor: PRESENCE_COLORS[dmPeerPresence.status],
                          borderColor: "var(--bg-card)",
                        }}
                      />
                    )}
                  </div>
                ) : activeChannel.isPrivate ? (
                  <Lock className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                ) : (
                  <Hash className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                )}

                <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                  {activeChannel.isDM ? dmPeer?.fullName : activeChannel.name}
                </p>

                {activeChannel.isDM && dmPeerPresence && (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    ·{" "}
                    {dmPeerPresence.status === "online"
                      ? "En ligne"
                      : dmPeerPresence.status === "away"
                      ? "Absent"
                      : "Hors ligne"}
                  </span>
                )}

                {!activeChannel.isDM && activeChannel.description && (
                  <>
                    <span style={{ color: "var(--border-strong)" }}>|</span>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      {activeChannel.description}
                    </p>
                  </>
                )}
              </div>

              {/* Header actions */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="p-2 rounded-lg text-xs transition-colors hover:bg-black/10"
                  style={{ color: "var(--text-muted)" }}
                  title="Rechercher (⌘K)"
                >
                  <SearchIcon className="w-4 h-4" />
                </button>

                {!activeChannel.isDM && (
                  <button
                    onClick={() => {
                      setShowPinnedPanel((v) => !v);
                      setShowMembersPanel(false);
                      setThreadMessage(null);
                    }}
                    className="p-2 rounded-lg text-xs transition-colors hover:bg-black/10"
                    style={{
                      color: showPinnedPanel ? "var(--agem-gold)" : "var(--text-muted)",
                      backgroundColor: showPinnedPanel ? "rgba(212,175,55,0.08)" : "transparent",
                    }}
                    title="Messages épinglés"
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                )}

                {!activeChannel.isDM && (
                  <button
                    onClick={() => {
                      setShowMembersPanel((v) => !v);
                      setShowPinnedPanel(false);
                      setThreadMessage(null);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors hover:bg-black/10"
                    style={{
                      color: showMembersPanel ? "var(--agem-gold)" : "var(--text-muted)",
                      backgroundColor: showMembersPanel ? "rgba(212,175,55,0.08)" : "transparent",
                    }}
                  >
                    <Users className="w-4 h-4" />
                    <span>{activeChannel.memberCount}</span>
                  </button>
                )}

                {canAdmin && !activeChannel.isDM && (
                  <button
                    onClick={() => setManagingChannelId(activeChannelId)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-black/10"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Gérer
                  </button>
                )}
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 flex min-h-0">
              <div className="flex-1 flex flex-col min-w-0 min-h-0">
                <MessageList
                  messages={activeMessages}
                  currentUserId={currentUser.id}
                  currentUserRole={currentUser.role}
                  onReply={(msg) => {
                    setThreadMessage(msg);
                    setShowMembersPanel(false);
                    setShowPinnedPanel(false);
                  }}
                  onReactionToggle={handleReactionToggle}
                  onPinToggle={handlePinToggle}
                  channelName={
                    activeChannel.isDM ? (dmPeer?.fullName ?? "dm") : activeChannel.name
                  }
                />

                {/* Typing indicator */}
                {typingUserNames.length > 0 && (
                  <div className="px-5 py-1.5 flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: "var(--text-muted)" }}
                        />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {typingUserNames.length === 1
                        ? `${typingUserNames[0]} est en train d'écrire…`
                        : `${typingUserNames.join(" et ")} écrivent…`}
                    </p>
                  </div>
                )}

                <MessageInput
                  channelName={
                    activeChannel.isDM ? (dmPeer?.fullName ?? "dm") : activeChannel.name
                  }
                  currentUserRole={currentUser.role}
                  mentionableUsers={mentionableUsers}
                  onSend={handleSend}
                  onTyping={handleTyping}
                  replyToId={threadMessage?.id}
                  replyToAuthor={threadMessage?.author.fullName}
                  onCancelReply={() => setThreadMessage(null)}
                />
              </div>

              <AnimatePresence>
                {showMembersPanel && (
                  <MembersPanel
                    channel={activeChannel}
                    allUsers={allUsers}
                    presences={presences}
                    currentUserId={currentUser.id}
                    onClose={() => setShowMembersPanel(false)}
                  />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showPinnedPanel && activeChannel && (
                  <PinnedMessagesPanel
                    channelId={activeChannel.id}
                    channelName={activeChannel.name}
                    currentUserRole={currentUser.role}
                    onClose={() => setShowPinnedPanel(false)}
                    onJumpTo={() => setShowPinnedPanel(false)}
                  />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {threadMessage && !showMembersPanel && !showPinnedPanel && (
                  <ThreadPanel
                    parentMessage={threadMessage}
                    currentUserId={currentUser.id}
                    currentUserRole={currentUser.role}
                    mentionableUsers={mentionableUsers}
                    onClose={() => setThreadMessage(null)}
                  />
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: "rgba(212,175,55,0.08)",
                border: "1px solid rgba(212,175,55,0.15)",
              }}
            >
              <MessageSquare className="w-8 h-8" style={{ color: "var(--agem-gold)", opacity: 0.6 }} />
            </div>
            <div className="text-center">
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                Bienvenue dans la messagerie AGEM
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Sélectionnez un canal ou démarrez une conversation directe
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateChannelModal
            users={allUsers}
            currentUserId={currentUser.id}
            onClose={() => setShowCreateModal(false)}
            onCreated={handleChannelCreated}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {managingChannelId && managingChannel && (
          <ManageMembersModal
            channel={managingChannel}
            allUsers={allUsers}
            currentUserId={currentUser.id}
            onClose={() => setManagingChannelId(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDMModal && (
          <StartDMModal
            users={allUsers}
            currentUserId={currentUser.id}
            presences={presences}
            onClose={() => setShowDMModal(false)}
            onDMCreated={handleDMCreated}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSearchModal && (
          <SearchModal
            onClose={() => setShowSearchModal(false)}
            onJumpTo={handleJumpToMessage}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// =====================================================
// Members Panel
// =====================================================

function MembersPanel({
  channel,
  allUsers,
  presences,
  currentUserId,
  onClose,
}: {
  channel: ChatChannel;
  allUsers: ChatUser[];
  presences: Record<string, UserPresence>;
  currentUserId: string;
  onClose: () => void;
}) {
  const members = allUsers.filter((u) => channel.memberIds.includes(u.id));
  const online = members.filter((u) => (presences[u.id]?.status ?? "offline") !== "offline");
  const offline = members.filter((u) => (presences[u.id]?.status ?? "offline") === "offline");

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 260, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className="border-l flex flex-col overflow-hidden shrink-0"
      style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
    >
      <div
        className="px-4 py-3.5 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Membres ({members.length})
        </p>
        <button onClick={onClose} className="p-1 rounded hover:bg-black/10 transition-colors">
          <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {online.length > 0 && (
          <>
            <p
              className="px-4 py-1 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              En ligne — {online.length}
            </p>
            {online.map((user) => (
              <MemberRow
                key={user.id}
                user={user}
                presence={presences[user.id]}
                isMe={user.id === currentUserId}
              />
            ))}
          </>
        )}
        {offline.length > 0 && (
          <>
            <p
              className="px-4 py-1 mt-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Hors ligne — {offline.length}
            </p>
            {offline.map((user) => (
              <MemberRow
                key={user.id}
                user={user}
                presence={presences[user.id]}
                isMe={user.id === currentUserId}
              />
            ))}
          </>
        )}
      </div>
    </motion.div>
  );
}

function MemberRow({
  user,
  presence,
  isMe,
}: {
  user: ChatUser;
  presence?: UserPresence;
  isMe: boolean;
}) {
  const status = presence?.status ?? "offline";
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/[0.03] transition-colors">
      <div className="relative">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: ROLE_COLORS[user.role] }}
        >
          {user.fullName.charAt(0)}
        </div>
        <span
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
          style={{
            backgroundColor: PRESENCE_COLORS[status],
            borderColor: "var(--bg-card)",
          }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
          {user.fullName}
          {isMe && (
            <span className="ml-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
              (vous)
            </span>
          )}
        </p>
        <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
          {ROLE_LABELS[user.role]}
        </p>
      </div>
    </div>
  );
}
