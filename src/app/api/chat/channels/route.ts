import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  try {
    const project = await prisma.project.findUnique({
      where: { code: "OBF-SIEGE-2026" },
      select: { id: true },
    });
    if (!project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });

    const channels = await prisma.channel.findMany({
      where: { projectId: project.id },
      include: {
        members: { select: { userId: true, isMuted: true, notifyLevel: true } },
        _count: { select: { messages: { where: { deletedAt: null } } } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ channels });
  } catch (error) {
    console.error("GET /api/chat/channels error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
