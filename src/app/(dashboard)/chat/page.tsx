import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { ChatPageClient } from "@/components/chat/ChatPageClient";
import type { ChatChannel, ChatMessage, ChatUser } from "@/components/chat/types";

export const metadata = {
  title: "Communication — AGEM TrackPro",
  description: "Messagerie temps réel du projet OBF-SIEGE-2026",
};

export default async function ChatPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, "chat", "view")) {
    return (
      <div className="p-6">
        <p style={{ color: "var(--status-danger)" }}>Accès non autorisé.</p>
      </div>
    );
  }

  const project = await prisma.project.findUnique({
    where: { code: "OBF-SIEGE-2026" },
    select: { id: true },
  });
  if (!project) redirect("/dashboard");

  // Load channels with members and recent messages
  const [channelsRaw, allUsersRaw] = await Promise.all([
    prisma.channel.findMany({
      where: { projectId: project.id },
      include: {
        members: {
          select: { userId: true, isMuted: true, notifyLevel: true },
        },
        messages: {
          where: { deletedAt: null, parentMessageId: null },
          orderBy: { createdAt: "asc" },
          take: 80,
          include: {
            author: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
            reactions: {
              include: { user: { select: { id: true, fullName: true } } },
            },
            _count: { select: { replies: { where: { deletedAt: null } } } },
            pinnedAs: { select: { id: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true, role: true, avatarUrl: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  // Filter channels by access
  const accessibleChannels = channelsRaw.filter((ch) => {
    if (!ch.isPrivate) return true;
    return ch.members.some((m) => m.userId === session.user.id);
  });

  const initialChannels: ChatChannel[] = accessibleChannels.map((ch) => {
    const myMembership = ch.members.find((m) => m.userId === session.user.id);
    return {
      id: ch.id,
      name: ch.name,
      description: ch.description,
      isPrivate: ch.isPrivate,
      isDM: ch.isDM,
      memberIds: ch.members.map((m) => m.userId),
      memberCount: ch.members.length,
      isMuted: myMembership?.isMuted ?? false,
      notifyLevel: myMembership?.notifyLevel ?? "all",
    };
  });

  const initialMessages: Record<string, ChatMessage[]> = Object.fromEntries(
    accessibleChannels.map((ch) => [
      ch.id,
      ch.messages.map((m) => ({
        id: m.id,
        content: m.content,
        authorId: m.author.id,
        author: {
          id: m.author.id,
          fullName: m.author.fullName,
          role: m.author.role,
          avatarUrl: m.author.avatarUrl,
        },
        channelId: ch.id,
        parentMessageId: m.parentMessageId,
        createdAt: m.createdAt.toISOString(),
        editedAt: m.editedAt?.toISOString() ?? null,
        reactions: m.reactions.map((r) => ({
          id: r.id,
          emoji: r.emoji,
          userId: r.userId,
          user: r.user,
        })),
        replyCount: m._count.replies,
        isPinned: !!m.pinnedAs,
      })),
    ])
  );

  // Compute initial unread counts per channel
  const readStates = await prisma.channelReadState.findMany({
    where: { userId: session.user.id },
    select: { channelId: true, lastReadAt: true },
  });
  const readStateMap = Object.fromEntries(
    readStates.map((rs) => [rs.channelId, rs.lastReadAt])
  );

  const initialUnreadCounts: Record<string, number> = {};
  for (const ch of accessibleChannels) {
    const lastReadAt = readStateMap[ch.id];
    const msgs = initialMessages[ch.id] ?? [];
    const unread = msgs.filter(
      (m) =>
        m.authorId !== session.user.id &&
        (!lastReadAt || new Date(m.createdAt) > lastReadAt)
    ).length;
    if (unread > 0) initialUnreadCounts[ch.id] = unread;
  }

  const currentUser: ChatUser & { role: (typeof allUsersRaw)[0]["role"] } = {
    id: session.user.id,
    fullName: session.user.name ?? "Utilisateur",
    role: session.user.role,
    avatarUrl: session.user.image,
  };

  const allUsers: ChatUser[] = allUsersRaw.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    role: u.role,
    avatarUrl: u.avatarUrl,
  }));

  const totalUnread = Object.values(initialUnreadCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 57px)" }}>
      {/* Page header */}
      <div
        className="px-4 lg:px-6 py-4 border-b shrink-0"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              Communication — Canaux
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              {initialChannels.filter((c) => !c.isDM).length} canal
              {initialChannels.filter((c) => !c.isDM).length > 1 ? "aux" : ""} ·{" "}
              {allUsersRaw.length} participants · Messagerie OBF-SIEGE-2026
            </p>
          </div>
          <div className="flex items-center gap-3">
            {totalUnread > 0 && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: "rgba(212,175,55,0.1)",
                  color: "var(--agem-gold-dark)",
                  border: "1px solid rgba(212,175,55,0.2)",
                }}
              >
                <span className="font-bold">{totalUnread}</span> non lu{totalUnread > 1 ? "s" : ""}
              </div>
            )}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: "rgba(34,197,94,0.1)",
                color: "#16a34a",
                border: "1px solid rgba(34,197,94,0.2)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              En direct
            </div>
          </div>
        </div>
      </div>

      {/* Chat app */}
      <div className="flex-1 min-h-0">
        <ChatPageClient
          initialChannels={initialChannels}
          initialMessages={initialMessages}
          currentUser={currentUser}
          allUsers={allUsers}
          initialUnreadCounts={initialUnreadCounts}
        />
      </div>
    </div>
  );
}
