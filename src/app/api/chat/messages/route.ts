import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const channelId = req.nextUrl.searchParams.get("channelId");
  const after = req.nextUrl.searchParams.get("after"); // ISO date string pour polling

  if (!channelId) return NextResponse.json({ error: "channelId requis" }, { status: 400 });

  try {
    const messages = await prisma.message.findMany({
      where: {
        channelId,
        deletedAt: null,
        parentMessageId: null, // Messages principaux uniquement
        ...(after ? { createdAt: { gt: new Date(after) } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: after ? 100 : 80,
      include: {
        author: {
          select: { id: true, fullName: true, role: true, avatarUrl: true },
        },
        reactions: {
          include: { user: { select: { id: true, fullName: true } } },
        },
        _count: {
          select: { replies: { where: { deletedAt: null } } },
        },
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET /api/chat/messages error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
