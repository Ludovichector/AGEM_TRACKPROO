import type { Role } from "@prisma/client";

export interface ChatUser {
  id: string;
  fullName: string;
  role: Role;
  avatarUrl?: string | null;
}

export interface ChatReaction {
  id: string;
  emoji: string;
  userId: string;
  user: { id: string; fullName: string };
}

export interface ChatMessage {
  id: string;
  content: string;
  authorId: string;
  author: ChatUser;
  channelId: string;
  parentMessageId?: string | null;
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  reactions: ChatReaction[];
  replyCount?: number;
  isPinned?: boolean;
}

export interface ChatChannel {
  id: string;
  name: string;
  description?: string | null;
  isPrivate: boolean;
  isDM: boolean;
  memberIds: string[];
  memberCount: number;
  isMuted?: boolean;
  notifyLevel?: string;
}

export interface UserPresence {
  userId: string;
  status: "online" | "away" | "dnd" | "offline";
  customText?: string | null;
  lastSeenAt?: string;
}

export interface PinnedMessage {
  id: string;
  channelId: string;
  messageId: string;
  pinnedById: string;
  pinnedAt: string;
  message: ChatMessage;
  pinnedBy: { id: string; fullName: string };
}

export const PRESENCE_COLORS: Record<string, string> = {
  online: "#22c55e",
  away: "#f59e0b",
  dnd: "#ef4444",
  offline: "#6b7280",
};

export const PRESENCE_LABELS: Record<string, string> = {
  online: "En ligne",
  away: "Absent",
  dnd: "Ne pas déranger",
  offline: "Hors ligne",
};
