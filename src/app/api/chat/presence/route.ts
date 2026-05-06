import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: fetch presence for given user IDs
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userIds = req.nextUrl.searchParams.get("userIds")?.split(",").filter(Boolean) ?? [];

  try {
    const presences = await prisma.userPresence.findMany({
      where: userIds.length > 0 ? { userId: { in: userIds } } : {},
      select: { userId: true, status: true, customText: true, lastSeenAt: true },
    });

    // Mark users as offline if not seen in last 3 minutes
    const now = Date.now();
    const result = presences.map((p) => ({
      ...p,
      status:
        now - new Date(p.lastSeenAt).getTime() > 3 * 60 * 1000
          ? "offline"
          : p.status,
    }));

    return NextResponse.json({ presences: result });
  } catch (error) {
    console.error("GET /api/chat/presence error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST: update own presence (heartbeat)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const status = body.status ?? "online";
    const customText = body.customText ?? null;

    await prisma.userPresence.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, status, customText, lastSeenAt: new Date() },
      update: { status, customText, lastSeenAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/chat/presence error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
