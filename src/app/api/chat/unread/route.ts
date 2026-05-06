import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Returns unread message counts per channel for the current user
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  try {
    const project = await prisma.project.findUnique({
      where: { code: "OBF-SIEGE-2026" },
      select: { id: true },
    });
    if (!project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });

    // Get all channels accessible to this user
    const channels = await prisma.channel.findMany({
      where: {
        projectId: project.id,
        OR: [
          { isPrivate: false },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      select: {
        id: true,
        readStates: {
          where: { userId: session.user.id },
          select: { lastReadAt: true },
        },
      },
    });

    const unreadCounts: Record<string, number> = {};

    await Promise.all(
      channels.map(async (ch) => {
        const lastReadAt = ch.readStates[0]?.lastReadAt;
        const count = await prisma.message.count({
          where: {
            channelId: ch.id,
            deletedAt: null,
            authorId: { not: session.user.id },
            ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
          },
        });
        if (count > 0) unreadCounts[ch.id] = count;
      })
    );

    return NextResponse.json({ unreadCounts });
  } catch (error) {
    console.error("GET /api/chat/unread error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
