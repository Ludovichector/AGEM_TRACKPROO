"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hash, Lock, Plus, ChevronDown, ChevronRight, Settings,
  Search, MessageSquarePlus, VolumeX, Circle, Clock, MinusCircle,
  MoreHorizontal, Trash2, LogOut, Edit2, Users, X, Check,
} from "lucide-react";
import type { ChatChannel, ChatUser, UserPresence } from "./types";
import { PRESENCE_COLORS, PRESENCE_LABELS } from "./types";
import type { Role } from "@prisma/client";
import { hasPermission, ROLE_COLORS } from "@/lib/permissions";
import { deleteChannel, leaveChannel, closeDM, renameChannel } from "@/server/actions/chat";

interface ChannelSidebarProps {
  channels: ChatChannel[];
  activeChannelId: string;
  currentUserId: string;
  currentUserRole: Role;
  currentUserName: string;
  currentUserPresence: UserPresence | null;
  allUsers: ChatUser[];
  presences: Record<string, UserPresence>;
  onSelectChannel: (id: string) => void;
  onCreateChannel: () => void;
  onManageMembers: (channelId: string) => void;
  onStartDM: () => void;
  onOpenSearch: () => void;
  onPresenceChange: (status: UserPresence["status"]) => void;
  onChannelDeleted: (channelId: string) => void;
  unreadCounts: Record<string, number>;
}

export function ChannelSidebar({
  channels,
  activeChannelId,
  currentUserId,
  currentUserRole,
  currentUserName,
  currentUserPresence,
  allUsers,
  presences,
  onSelectChannel,
  onCreateChannel,
  onManageMembers,
  onStartDM,
  onOpenSearch,
  onPresenceChange,
  onChannelDeleted,
  unreadCounts,
}: ChannelSidebarProps) {
  const [publicOpen, setPublicOpen] = useState(true);
  const [privateOpen, setPrivateOpen] = useState(true);
  const [dmOpen, setDmOpen] = useState(true);
  const [showPresenceMenu, setShowPresenceMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    channelId: string;
    type: "channel" | "dm";
    isPrivate: boolean;
    x: number;
    y: number;
  } | null>(null);
  const [renaming, setRenaming] = useState<{ channelId: string; value: string } | null>(null);
  const [pending, setPending] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const contextRef = useRef<HTMLDivElement>(null);

  const canAdmin = hasPermission(currentUserRole, "chat", "delete");

  const publicChannels = channels.filter((ch) => !ch.isPrivate && !ch.isDM);
  const privateChannels = channels.filter(
    (ch) => ch.isPrivate && !ch.isDM && ch.memberIds.includes(currentUserId)
  );
  const dmChannels = channels.filter(
    (ch) => ch.isDM && ch.memberIds.includes(currentUserId)
  );

  const initials = currentUserName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const currentStatus = currentUserPresence?.status ?? "online";

  const getDMPeer = (channel: ChatChannel): ChatUser | null => {
    const otherId = channel.memberIds.find((id) => id !== currentUserId);
    return allUsers.find((u) => u.id === otherId) ?? null;
  };

  const presenceStatuses: { status: UserPresence["status"]; label: string; icon: React.ReactNode }[] = [
    { status: "online", label: "En ligne", icon: <Circle className="w-3 h-3 fill-green-400 text-green-400" /> },
    { status: "away", label: "Absent", icon: <Clock className="w-3 h-3 text-amber-500" /> },
    { status: "dnd", label: "Ne pas déranger", icon: <MinusCircle className="w-3 h-3 text-red-500" /> },
    { status: "offline", label: "Apparaître hors ligne", icon: <Circle className="w-3 h-3 text-gray-400" /> },
  ];

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  // Close context menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (contextRef.current && !contextRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (renaming) renameInputRef.current?.focus();
  }, [renaming]);

  const openContextMenu = (
    e: React.MouseEvent,
    channelId: string,
    type: "channel" | "dm",
    isPrivate: boolean
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ channelId, type, isPrivate, x: e.clientX, y: e.clientY });
  };

  const handleDelete = async (channelId: string) => {
    if (!confirm("Supprimer ce canal définitivement ?")) return;
    setContextMenu(null);
    setPending(true);
    await deleteChannel(channelId);
    onChannelDeleted(channelId);
    setPending(false);
  };

  const handleLeave = async (channelId: string) => {
    setContextMenu(null);
    setPending(true);
    await leaveChannel(channelId);
    onChannelDeleted(channelId);
    setPending(false);
  };

  const handleCloseDM = async (channelId: string) => {
    setContextMenu(null);
    setPending(true);
    await closeDM(channelId);
    onChannelDeleted(channelId);
    setPending(false);
  };

  const handleRenameSubmit = async () => {
    if (!renaming) return;
    setPending(true);
    await renameChannel(renaming.channelId, renaming.value);
    setRenaming(null);
    setPending(false);
  };

  return (
    <div
      className="w-64 shrink-0 flex flex-col h-full"
      style={{
        backgroundColor: "var(--bg-card)",
        borderRight: "1px solid var(--border-subtle)",
      }}
    >
      {/* Workspace header */}
      <div
        className="px-4 py-3.5 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div>
          <p className="text-sm font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
            AGEM TrackPro
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>OBF-SIEGE-2026</p>
          </div>
        </div>
        {totalUnread > 0 && (
          <span
            className="text-xs px-1.5 py-0.5 rounded-full font-bold"
            style={{ backgroundColor: "var(--agem-gold)", color: "var(--agem-black)" }}
          >
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </div>

      {/* Search bar */}
      <div className="px-3 py-2">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-black/[0.04]"
          style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
        >
          <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
          <span className="text-xs flex-1" style={{ color: "var(--text-muted)" }}>Rechercher…</span>
          <kbd
            className="text-xs px-1 rounded font-mono"
            style={{ backgroundColor: "var(--border-subtle)", color: "var(--text-muted)", fontSize: "10px" }}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Channels list */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* Public channels */}
        <ChannelGroup
          label="Canaux"
          isOpen={publicOpen}
          onToggle={() => setPublicOpen((o) => !o)}
          onAdd={canAdmin ? onCreateChannel : undefined}
        >
          {publicChannels.map((ch) => (
            <ChannelItem
              key={ch.id}
              channel={ch}
              isActive={ch.id === activeChannelId}
              unread={unreadCounts[ch.id] ?? 0}
              canAdmin={canAdmin}
              renaming={renaming?.channelId === ch.id ? renaming.value : null}
              renameInputRef={renaming?.channelId === ch.id ? renameInputRef : undefined}
              onSelect={() => onSelectChannel(ch.id)}
              onManage={() => onManageMembers(ch.id)}
              onContextMenu={(e) => openContextMenu(e, ch.id, "channel", ch.isPrivate)}
              onRenameChange={(v) => setRenaming({ channelId: ch.id, value: v })}
              onRenameSubmit={handleRenameSubmit}
              onRenameCancel={() => setRenaming(null)}
            />
          ))}
        </ChannelGroup>

        {/* Private channels */}
        {(privateChannels.length > 0 || canAdmin) && (
          <ChannelGroup
            label="Canaux privés"
            isOpen={privateOpen}
            onToggle={() => setPrivateOpen((o) => !o)}
          >
            {privateChannels.map((ch) => (
              <ChannelItem
                key={ch.id}
                channel={ch}
                isActive={ch.id === activeChannelId}
                unread={unreadCounts[ch.id] ?? 0}
                canAdmin={canAdmin}
                renaming={renaming?.channelId === ch.id ? renaming.value : null}
                renameInputRef={renaming?.channelId === ch.id ? renameInputRef : undefined}
                onSelect={() => onSelectChannel(ch.id)}
                onManage={() => onManageMembers(ch.id)}
                onContextMenu={(e) => openContextMenu(e, ch.id, "channel", ch.isPrivate)}
                onRenameChange={(v) => setRenaming({ channelId: ch.id, value: v })}
                onRenameSubmit={handleRenameSubmit}
                onRenameCancel={() => setRenaming(null)}
              />
            ))}
          </ChannelGroup>
        )}

        {/* Direct Messages */}
        <ChannelGroup
          label="Messages directs"
          isOpen={dmOpen}
          onToggle={() => setDmOpen((o) => !o)}
          onAdd={onStartDM}
        >
          {dmChannels.length === 0 && (
            <button
              onClick={onStartDM}
              className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg mx-1 transition-colors hover:bg-black/[0.04]"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
              <span className="text-xs italic" style={{ color: "var(--text-muted)" }}>
                Démarrer une conversation
              </span>
            </button>
          )}
          {dmChannels.map((ch) => {
            const peer = getDMPeer(ch);
            if (!peer) return null;
            const peerStatus = presences[peer.id]?.status ?? "offline";
            const unread = unreadCounts[ch.id] ?? 0;
            const isActive = ch.id === activeChannelId;

            return (
              <div
                key={ch.id}
                className="relative mx-1 rounded-lg mb-0.5 group"
                style={{
                  backgroundColor: isActive
                    ? "rgba(212,175,55,0.1)"
                    : undefined,
                }}
              >
                <button
                  onClick={() => onSelectChannel(ch.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-lg transition-colors hover:bg-black/[0.04]"
                >
                  <div className="relative shrink-0">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: ROLE_COLORS[peer.role] }}
                    >
                      {peer.fullName.charAt(0)}
                    </div>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2"
                      style={{
                        backgroundColor: PRESENCE_COLORS[peerStatus],
                        borderColor: "var(--bg-card)",
                      }}
                    />
                  </div>
                  <span
                    className="text-sm truncate flex-1"
                    style={{
                      color: isActive ? "var(--agem-gold-dark)" : "var(--text-primary)",
                      fontWeight: unread > 0 || isActive ? 600 : 400,
                    }}
                  >
                    {peer.fullName}
                  </span>
                  {unread > 0 && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                      style={{ backgroundColor: "var(--agem-gold)", color: "var(--agem-black)" }}
                    >
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </button>
                {/* DM close button on hover */}
                <button
                  onClick={(e) => openContextMenu(e, ch.id, "dm", false)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--text-muted)" }}
                  title="Options"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </ChannelGroup>
      </div>

      {/* Current user / presence */}
      <div
        className="relative px-3 py-3 border-t shrink-0"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <button
          onClick={() => setShowPresenceMenu((v) => !v)}
          className="w-full flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-black/[0.04]"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 relative"
            style={{ backgroundColor: "var(--agem-gold-dark)" }}
          >
            {initials}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{
                backgroundColor: PRESENCE_COLORS[currentStatus],
                borderColor: "var(--bg-card)",
              }}
            />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-xs font-semibold truncate leading-tight" style={{ color: "var(--text-primary)" }}>
              {currentUserName}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              {PRESENCE_LABELS[currentStatus]}
            </p>
          </div>
          <Settings className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
        </button>

        <AnimatePresence>
          {showPresenceMenu && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-3 right-3 mb-2 rounded-xl border shadow-xl overflow-hidden z-20"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
            >
              <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Mon statut
                </p>
              </div>
              {presenceStatuses.map(({ status, label, icon }) => (
                <button
                  key={status}
                  onClick={() => {
                    onPresenceChange(status);
                    setShowPresenceMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-black/[0.04]"
                >
                  {icon}
                  <span
                    className="text-sm"
                    style={{
                      color: "var(--text-primary)",
                      fontWeight: currentStatus === status ? 600 : 400,
                    }}
                  >
                    {label}
                  </span>
                  {currentStatus === status && (
                    <span className="ml-auto text-xs" style={{ color: "var(--agem-gold)" }}>✓</span>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            ref={contextRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 rounded-xl border shadow-2xl overflow-hidden min-w-[180px]"
            style={{
              top: Math.min(contextMenu.y, window.innerHeight - 220),
              left: Math.min(contextMenu.x, window.innerWidth - 200),
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-subtle)",
            }}
          >
            {contextMenu.type === "channel" ? (
              <>
                <button
                  onClick={() => {
                    const ch = channels.find((c) => c.id === contextMenu.channelId);
                    setRenaming({ channelId: contextMenu.channelId, value: ch?.name ?? "" });
                    setContextMenu(null);
                  }}
                  disabled={!canAdmin || pending}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-black/[0.04] disabled:opacity-40"
                  style={{ color: "var(--text-primary)" }}
                >
                  <Edit2 className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                  Renommer
                </button>
                <button
                  onClick={() => { onManageMembers(contextMenu.channelId); setContextMenu(null); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-black/[0.04]"
                  style={{ color: "var(--text-primary)" }}
                >
                  <Users className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                  Membres
                </button>
                <div className="h-px my-1" style={{ backgroundColor: "var(--border-subtle)" }} />
                {!canAdmin && (
                  <button
                    onClick={() => handleLeave(contextMenu.channelId)}
                    disabled={pending}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-amber-50 disabled:opacity-40"
                    style={{ color: "#b45309" }}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Quitter le canal
                  </button>
                )}
                {canAdmin && (
                  <button
                    onClick={() => handleDelete(contextMenu.channelId)}
                    disabled={pending}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-red-50 disabled:opacity-40"
                    style={{ color: "var(--status-danger)" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer le canal
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => handleCloseDM(contextMenu.channelId)}
                  disabled={pending}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-black/[0.04] disabled:opacity-40"
                  style={{ color: "var(--text-primary)" }}
                >
                  <X className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                  Fermer la conversation
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =====================================================
// Sub-components
// =====================================================

function ChannelGroup({
  label,
  isOpen,
  onToggle,
  onAdd,
  children,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <div className="flex items-center justify-between px-3 py-1 group">
        <button
          onClick={onToggle}
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-opacity hover:opacity-100"
          style={{ color: "var(--text-muted)", opacity: 0.7 }}
        >
          {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          {label}
        </button>
        {onAdd && (
          <button
            onClick={onAdd}
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-0.5 rounded"
            title="Ajouter"
            style={{ color: "var(--text-muted)" }}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ overflow: "hidden" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChannelItem({
  channel,
  isActive,
  unread,
  canAdmin,
  renaming,
  renameInputRef,
  onSelect,
  onManage,
  onContextMenu,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
}: {
  channel: ChatChannel;
  isActive: boolean;
  unread: number;
  canAdmin: boolean;
  renaming: string | null;
  renameInputRef?: React.RefObject<HTMLInputElement | null>;
  onSelect: () => void;
  onManage: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onRenameChange: (v: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
}) {
  if (renaming !== null) {
    return (
      <div
        className="mx-1 rounded-lg mb-0.5 flex items-center gap-1 px-2 py-1"
        style={{ backgroundColor: "rgba(212,175,55,0.08)", border: "1px solid var(--agem-gold)" }}
      >
        {channel.isPrivate
          ? <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
          : <Hash className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />}
        <input
          ref={renameInputRef}
          value={renaming}
          onChange={(e) => onRenameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onRenameSubmit();
            if (e.key === "Escape") onRenameCancel();
          }}
          className="flex-1 text-sm bg-transparent outline-none min-w-0"
          style={{ color: "var(--text-primary)" }}
        />
        <button onClick={onRenameSubmit} className="p-0.5 text-green-600 hover:text-green-700">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={onRenameCancel} className="p-0.5" style={{ color: "var(--text-muted)" }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative mx-1 rounded-lg mb-0.5 group"
      style={{
        backgroundColor: isActive ? "rgba(212,175,55,0.1)" : undefined,
      }}
    >
      <button
        onClick={onSelect}
        onContextMenu={onContextMenu}
        className="w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-lg transition-colors hover:bg-black/[0.04]"
      >
        {channel.isPrivate ? (
          <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
        ) : (
          <Hash className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
        )}
        <span
          className="text-sm truncate flex-1"
          style={{
            color: isActive ? "var(--agem-gold-dark)" : "var(--text-primary)",
            fontWeight: unread > 0 || isActive ? 600 : 400,
          }}
        >
          {channel.name}
        </span>
        {channel.isMuted && (
          <VolumeX className="w-3 h-3 shrink-0" style={{ color: "var(--text-muted)" }} />
        )}
        {unread > 0 && !channel.isMuted && (
          <span
            className="text-xs px-1.5 py-0.5 rounded-full font-bold"
            style={{ backgroundColor: "var(--agem-gold)", color: "var(--agem-black)" }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Hover actions */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {canAdmin && (
          <button
            onClick={(e) => { e.stopPropagation(); onManage(); }}
            className="p-1 rounded hover:bg-black/[0.06]"
            style={{ color: "var(--text-muted)" }}
            title="Membres"
          >
            <Users className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={onContextMenu}
          className="p-1 rounded hover:bg-black/[0.06]"
          style={{ color: "var(--text-muted)" }}
          title="Options"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
