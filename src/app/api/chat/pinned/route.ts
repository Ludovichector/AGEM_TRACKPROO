import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const channelId = req.nextUrl.searchParams.get("channelId");
  if (!channelId) return NextResponse.json({ error: "channelId requis" }, { status: 400 });

  try {
    const pinned = await prisma.pinnedMessage.findMany({
      where: { channelId },
      orderBy: { pinnedAt: "desc" },
      include: {
        message: {
          include: {
            author: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
            reactions: { include: { user: { select: { id: true, fullName: true } } } },
            _count: { select: { replies: { where: { deletedAt: null } } } },
          },
        },
        pinnedBy: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json({ pinned });
  } catch (error) {
    console.error("GET /api/chat/pinned error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
