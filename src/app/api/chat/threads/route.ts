import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const messageId = req.nextUrl.searchParams.get("messageId");
  if (!messageId) return NextResponse.json({ error: "messageId requis" }, { status: 400 });

  try {
    const replies = await prisma.message.findMany({
      where: { parentMessageId: messageId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
        reactions: { include: { user: { select: { id: true, fullName: true } } } },
      },
    });

    return NextResponse.json({ replies });
  } catch (error) {
    console.error("GET /api/chat/threads error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
