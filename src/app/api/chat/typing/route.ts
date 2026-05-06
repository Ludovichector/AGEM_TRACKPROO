import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// In-memory typing store (ephemeral, resets on server restart)
// For production, use Redis
const typingStore = new Map<string, Map<string, number>>();

const TYPING_TIMEOUT_MS = 4000;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const channelId = req.nextUrl.searchParams.get("channelId");
  if (!channelId) return NextResponse.json({ error: "channelId requis" }, { status: 400 });

  const channelTyping = typingStore.get(channelId);
  if (!channelTyping) return NextResponse.json({ typing: [] });

  const now = Date.now();
  const active: string[] = [];
  for (const [userId, ts] of channelTyping.entries()) {
    if (now - ts < TYPING_TIMEOUT_MS && userId !== session.user.id) {
      active.push(userId);
    }
  }

  return NextResponse.json({ typing: active });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  try {
    const { channelId, isTyping } = await req.json();
    if (!channelId) return NextResponse.json({ error: "channelId requis" }, { status: 400 });

    if (!typingStore.has(channelId)) {
      typingStore.set(channelId, new Map());
    }

    const channelTyping = typingStore.get(channelId)!;
    if (isTyping) {
      channelTyping.set(session.user.id, Date.now());
    } else {
      channelTyping.delete(session.user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/chat/typing error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
