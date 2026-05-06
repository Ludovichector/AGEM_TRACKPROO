import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q") ?? "";
  const channelId = req.nextUrl.searchParams.get("channelId");

  if (!q.trim()) return NextResponse.json({ messages: [] });

  try {
    const project = await prisma.project.findUnique({
      where: { code: "OBF-SIEGE-2026" },
      select: { id: true },
    });
    if (!project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });

    const accessibleChannels = await prisma.channel.findMany({
      where: {
        projectId: project.id,
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
        content: { contains: q.trim(), mode: "insensitive" },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        author: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
        channel: { select: { id: true, name: true, isDM: true } },
        reactions: { include: { user: { select: { id: true, fullName: true } } } },
        _count: { select: { replies: { where: { deletedAt: null } } } },
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET /api/chat/search error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
