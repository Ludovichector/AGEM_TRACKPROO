import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";

const evmCreateSchema = z.object({
  projectId: z.string(),
  monthNumber: z.number().int().min(1).max(67),
  pvCumulXOF: z.number().int().min(0),
  evCumulXOF: z.number().int().min(0),
  acCumulXOF: z.number().int().min(0),
  physicalProgress: z.number().min(0).max(100),
  bacXOF: z.string(),
  notes: z.string().optional(),
  enteredById: z.string(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const entries = await prisma.evmMonthlyEntry.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { monthNumber: "asc" },
    include: { enteredBy: { select: { fullName: true } } },
  });

  return NextResponse.json(entries.map((e) => ({
    ...e,
    pvCumulXOF: e.pvCumulXOF.toString(),
    evCumulXOF: e.evCumulXOF.toString(),
    acCumulXOF: e.acCumulXOF.toString(),
    bacXOF: e.bacXOF.toString(),
  })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  if (!hasPermission(session.user.role, "evm", "edit")) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = evmCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error }, { status: 400 });
  }

  const { projectId, monthNumber, pvCumulXOF, evCumulXOF, acCumulXOF, physicalProgress, bacXOF, notes, enteredById } = parsed.data;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);

  const entry = await prisma.evmMonthlyEntry.upsert({
    where: { projectId_monthNumber: { projectId, monthNumber } },
    create: {
      projectId,
      monthNumber,
      monthDate: startOfMonth,
      pvCumulXOF: BigInt(pvCumulXOF),
      evCumulXOF: BigInt(evCumulXOF),
      acCumulXOF: BigInt(acCumulXOF),
      physicalProgress,
      bacXOF: BigInt(bacXOF),
      notes,
      enteredById,
    },
    update: {
      pvCumulXOF: BigInt(pvCumulXOF),
      evCumulXOF: BigInt(evCumulXOF),
      acCumulXOF: BigInt(acCumulXOF),
      physicalProgress,
      notes,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "evm.entered",
      entityType: "EvmMonthlyEntry",
      entityId: entry.id,
      metadata: { monthNumber, projectId },
    },
  });

  return NextResponse.json({
    ...entry,
    pvCumulXOF: entry.pvCumulXOF.toString(),
    evCumulXOF: entry.evCumulXOF.toString(),
    acCumulXOF: entry.acCumulXOF.toString(),
    bacXOF: entry.bacXOF.toString(),
  });
}
