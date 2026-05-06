"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

// =====================================================
// HELPERS
// =====================================================

async function getSession() {
  const session = await auth();
  if (!session) throw new Error("Non authentifié");
  return session;
}

async function getProjectId() {
  const project = await prisma.project.findUnique({
    where: { code: "OBF-SIEGE-2026" },
    select: { id: true },
  });
  if (!project) throw new Error("Projet introuvable");
  return project.id;
}

// =====================================================
// MESSAGES
// =====================================================

export async function sendMessage(
  channelId: string,
  content: string,
  parentMessageId?: string
) {
  const session = await getSession();
  if (!hasPermission(session.user.role, "chat", "create")) {
    return { success: false, error: "Vous n'avez pas la permission d'envoyer des messages." };
  }
  if (!content.trim()) return { success: false, error: "Message vide." };

  try {
    const mentionMatches = content.match(/@\[([^\]]+)\]\(([^)]+)\)/g) ?? [];
    const mentions = mentionMatches.map((m) => {
      const match = m.match(/@\[([^\]]+)\]\(([^)]+)\)/);
      return match ? match[2] : "";
    }).filter(Boolean);

    const message = await prisma.message.create({
      data: {
        channelId,
        authorId: session.user.id,
        content: content.trim(),
        mentions,
        parentMessageId: parentMessageId ?? null,
      },
      include: {
        author: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
        reactions: { include: { user: { select: { id: true, fullName: true } } } },
      },
    });

    revalidatePath("/chat");
    return { success: true, message };
  } catch (error) {
    console.error("sendMessage error:", error);
    return { success: false, error: "Erreur lors de l'envoi du message." };
  }
}

export async function editMessage(messageId: string, content: string) {
  const session = await getSession();
  if (!content.trim()) return { success: false, error: "Message vide." };

  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { authorId: true },
    });
    if (!message) return { success: false, error: "Message introuvable." };

    const isOwner = message.authorId === session.user.id;
    const isAdmin = hasPermission(session.user.role, "chat", "delete");

    if (!isOwner && !isAdmin) {
      return { success: false, error: "Vous ne pouvez modifier que vos propres messages." };
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { content: content.trim(), editedAt: new Date() },
    });

    revalidatePath("/chat");
    return { success: true };
  } catch (error) {
    console.error("editMessage error:", error);
    return { success: false, error: "Erreur lors de la modification." };
  }
}

export async function deleteMessage(messageId: string) {
  const session = await getSession();

  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { authorId: true },
    });
    if (!message) return { success: false, error: "Message introuvable." };

    const isOwner = message.authorId === session.user.id;
    const isAdmin = hasPermission(session.user.role, "chat", "delete");

    if (!isOwner && !isAdmin) {
      return { success: false, error: "Permission refusée." };
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/chat");
    return { success: true };
  } catch (error) {
    console.error("deleteMessage error:", error);
    return { success: false, error: "Erreur lors de la suppression." };
  }
}

// =====================================================
// RÉACTIONS
// =====================================================

export async function toggleReaction(messageId: string, emoji: string) {
  const session = await getSession();
  if (!hasPermission(session.user.role, "chat", "create")) {
    return { success: false, error: "Permission refusée." };
  }

  try {
    const existing = await prisma.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: session.user.id,
          emoji,
        },
      },
    });

    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      return { success: true, action: "removed" };
    } else {
      await prisma.reaction.create({
        data: { messageId, userId: session.user.id, emoji },
      });
      return { success: true, action: "added" };
    }
  } catch (error) {
    console.error("toggleReaction error:", error);
    return { success: false, error: "Erreur lors de la réaction." };
  }
}

// =====================================================
// CANAUX
// =====================================================

export async function createChannel(data: {
  name: string;
  description?: string;
  isPrivate: boolean;
  memberIds: string[];
}) {
  const session = await getSession();
  if (!hasPermission(session.user.role, "chat", "delete")) {
    return { success: false, error: "Seuls les administrateurs peuvent créer des canaux." };
  }

  try {
    const projectId = await getProjectId();

    const channel = await prisma.channel.create({
      data: {
        projectId,
        name: data.name.toLowerCase().replace(/\s+/g, "-"),
        description: data.description || null,
        isPrivate: data.isPrivate,
        isDM: false,
        members: {
          create: [
            { userId: session.user.id },
            ...data.memberIds
              .filter((id) => id !== session.user.id)
              .map((userId) => ({ userId })),
          ],
        },
      },
    });

    revalidatePath("/chat");
    return { success: true, channelId: channel.id };
  } catch (error: unknown) {
    console.error("createChannel error:", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return { success: false, error: "Un canal avec ce nom existe déjà." };
    }
    return { success: false, error: "Erreur lors de la création du canal." };
  }
}

export async function addChannelMember(channelId: string, userId: string) {
  const session = await getSession();
  if (!hasPermission(session.user.role, "chat", "delete")) {
    return { success: false, error: "Permission refusée." };
  }

  try {
    await prisma.channelMember.upsert({
      where: { channelId_userId: { channelId, userId } },
      create: { channelId, userId },
      update: {},
    });

    revalidatePath("/chat");
    return { success: true };
  } catch (error) {
    console.error("addChannelMember error:", error);
    return { success: false, error: "Erreur lors de l'ajout du membre." };
  }
}

export async function removeChannelMember(channelId: string, userId: string) {
  const session = await getSession();
  if (!hasPermission(session.user.role, "chat", "delete")) {
    return { success: false, error: "Permission refusée." };
  }

  try {
    await prisma.channelMember.delete({
      where: { channelId_userId: { channelId, userId } },
    });

    revalidatePath("/chat");
    return { success: true };
  } catch (error) {
    console.error("removeChannelMember error:", error);
    return { success: false, error: "Erreur lors du retrait du membre." };
  }
}

// =====================================================
// MESSAGES DIRECTS (DM)
// =====================================================

export async function getOrCreateDM(targetUserId: string) {
  const session = await getSession();
  const myId = session.user.id;

  if (myId === targetUserId) {
    return { success: false, error: "Vous ne pouvez pas démarrer un DM avec vous-même." };
  }

  try {
    const projectId = await getProjectId();

    // Find existing DM between exactly these two users
    const candidates = await prisma.channel.findMany({
      where: {
        projectId,
        isDM: true,
        members: { some: { userId: myId } },
      },
      include: { members: { select: { userId: true } } },
    });

    const exactDM = candidates.find(
      (ch) =>
        ch.members.length === 2 &&
        ch.members.some((m) => m.userId === myId) &&
        ch.members.some((m) => m.userId === targetUserId)
    );

    if (exactDM) {
      return { success: true, channelId: exactDM.id, isNew: false };
    }

    // Build stable DM name
    const [id1, id2] = [myId, targetUserId].sort();
    const dmName = `dm-${id1.slice(0, 8)}-${id2.slice(0, 8)}`;

    const channel = await prisma.channel.create({
      data: {
        projectId,
        name: dmName,
        isPrivate: true,
        isDM: true,
        members: {
          create: [{ userId: myId }, { userId: targetUserId }],
        },
      },
    });

    revalidatePath("/chat");
    return { success: true, channelId: channel.id, isNew: true };
  } catch (error) {
    console.error("getOrCreateDM error:", error);
    return { success: false, error: "Erreur lors de la création du DM." };
  }
}

// =====================================================
// MESSAGES ÉPINGLÉS
// =====================================================

export async function pinMessage(messageId: string, channelId: string) {
  const session = await getSession();
  if (!hasPermission(session.user.role, "chat", "delete")) {
    return { success: false, error: "Seuls les admins peuvent épingler des messages." };
  }

  try {
    await prisma.pinnedMessage.upsert({
      where: { messageId },
      create: {
        channelId,
        messageId,
        pinnedById: session.user.id,
      },
      update: {},
    });

    revalidatePath("/chat");
    return { success: true };
  } catch (error) {
    console.error("pinMessage error:", error);
    return { success: false, error: "Erreur lors de l'épinglage." };
  }
}

export async function unpinMessage(messageId: string) {
  const session = await getSession();
  if (!hasPermission(session.user.role, "chat", "delete")) {
    return { success: false, error: "Permission refusée." };
  }

  try {
    await prisma.pinnedMessage.delete({ where: { messageId } });
    revalidatePath("/chat");
    return { success: true };
  } catch (error) {
    console.error("unpinMessage error:", error);
    return { success: false, error: "Erreur lors du désépinglage." };
  }
}

// =====================================================
// LECTURE / UNREAD
// =====================================================

export async function markChannelRead(channelId: string) {
  const session = await getSession();

  try {
    await prisma.channelReadState.upsert({
      where: { channelId_userId: { channelId, userId: session.user.id } },
      create: { channelId, userId: session.user.id, lastReadAt: new Date() },
      update: { lastReadAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    console.error("markChannelRead error:", error);
    return { success: false };
  }
}

// =====================================================
// PRÉSENCE UTILISATEUR
// =====================================================

export async function updatePresence(
  status: "online" | "away" | "dnd" | "offline",
  customText?: string
) {
  const session = await getSession();

  try {
    await prisma.userPresence.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        status,
        customText: customText ?? null,
        lastSeenAt: new Date(),
      },
      update: {
        status,
        customText: customText ?? null,
        lastSeenAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("updatePresence error:", error);
    return { success: false };
  }
}

// =====================================================
// PARAMÈTRES DE CANAL (MUTE)
// =====================================================

export async function updateChannelMemberSettings(
  channelId: string,
  settings: { isMuted?: boolean; notifyLevel?: string }
) {
  const session = await getSession();

  try {
    await prisma.channelMember.update({
      where: { channelId_userId: { channelId, userId: session.user.id } },
      data: {
        ...(settings.isMuted !== undefined ? { isMuted: settings.isMuted } : {}),
        ...(settings.notifyLevel !== undefined ? { notifyLevel: settings.notifyLevel } : {}),
      },
    });

    revalidatePath("/chat");
    return { success: true };
  } catch (error) {
    console.error("updateChannelMemberSettings error:", error);
    return { success: false, error: "Erreur lors de la mise à jour des paramètres." };
  }
}

// =====================================================
// RECHERCHE DE MESSAGES
// =====================================================

export async function deleteChannel(channelId: string) {
  const session = await getSession();
  if (!hasPermission(session.user.role, "chat", "delete")) {
    return { success: false, error: "Permission refusée." };
  }
  try {
    await prisma.channel.delete({ where: { id: channelId } });
    revalidatePath("/chat");
    return { success: true };
  } catch (error) {
    console.error("deleteChannel error:", error);
    return { success: false, error: "Erreur lors de la suppression." };
  }
}

export async function leaveChannel(channelId: string) {
  const session = await getSession();
  try {
    await prisma.channelMember.delete({
      where: { channelId_userId: { channelId, userId: session.user.id } },
    });
    revalidatePath("/chat");
    return { success: true };
  } catch (error) {
    console.error("leaveChannel error:", error);
    return { success: false, error: "Erreur lors du départ du canal." };
  }
}

export async function closeDM(channelId: string) {
  const session = await getSession();
  try {
    // Remove self from DM members (soft-leave)
    await prisma.channelMember.deleteMany({
      where: { channelId, userId: session.user.id },
    });
    revalidatePath("/chat");
    return { success: true };
  } catch (error) {
    console.error("closeDM error:", error);
    return { success: false, error: "Erreur lors de la fermeture." };
  }
}

export async function renameChannel(channelId: string, name: string, description?: string) {
  const session = await getSession();
  if (!hasPermission(session.user.role, "chat", "delete")) {
    return { success: false, error: "Permission refusée." };
  }
  if (!name.trim()) return { success: false, error: "Nom requis." };
  try {
    await prisma.channel.update({
      where: { id: channelId },
      data: { name: name.trim().toLowerCase().replace(/\s+/g, "-"), description: description ?? null },
    });
    revalidatePath("/chat");
    return { success: true };
  } catch (error) {
    console.error("renameChannel error:", error);
    return { success: false, error: "Erreur lors du renommage." };
  }
}

export async function searchMessages(query: string, channelId?: string) {
  const session = await getSession();
  if (!query.trim()) return { success: true, messages: [] };

  try {
    const projectId = await getProjectId();

    const accessibleChannels = await prisma.channel.findMany({
      where: {
        projectId,
        ...(channelId ? { id: channelId } : {}),
        OR: [
          { isPrivate: false },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      select: { id: true },
    });

    const channelIds = accessibleChannels.map((c) => c.id);

    const messages = await prisma.message.findMany({
      where: {
        channelId: { in: channelIds },
        deletedAt: null,
        content: { contains: query.trim(), mode: "insensitive" },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        author: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
        channel: { select: { id: true, name: true, isDM: true } },
        reactions: { include: { user: { select: { id: true, fullName: true } } } },
      },
    });

    return { success: true, messages };
  } catch (error) {
    console.error("searchMessages error:", error);
    return { success: false, messages: [], error: "Erreur lors de la recherche." };
  }
}
