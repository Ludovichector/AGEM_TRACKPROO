"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Role, LegalActionStatus } from "@prisma/client";

const updateLegalStatusSchema = z.object({
  actionId: z.string().min(1),
  status: z.enum([
    "TO_START",
    "IN_PROGRESS",
    "ON_HOLD",
    "COMPLETED",
    "BLOCKED",
    "LEGAL_MILESTONE_PENDING",
  ]),
});

export async function updateLegalActionStatus(formData: z.infer<typeof updateLegalStatusSchema>) {
  const session = await auth();
  if (!session) return { error: "Non authentifié" };

  const role = session.user.role as Role;
  if (!hasPermission(role, "legal", "edit")) {
    return { error: "Permission refusée : vous n'avez pas le droit de modifier les statuts légaux." };
  }

  const parsed = updateLegalStatusSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Données invalides" };
  }

  const { actionId, status } = parsed.data;

  try {
    const action = await prisma.legalAction.findUnique({ where: { id: actionId } });
    if (!action) return { error: "Action introuvable" };

    const updated = await prisma.legalAction.update({
      where: { id: actionId },
      data: { status },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "LEGAL_STATUS_UPDATED",
        entityType: "LegalAction",
        entityId: actionId,
        metadata: { 
          title: action.title, 
          oldStatus: action.status, 
          newStatus: status 
        },
      },
    });

    revalidatePath("/legal");
    return { success: true, status: updated.status };
  } catch (err) {
    console.error("updateLegalActionStatus error:", err);
    return { error: "Erreur serveur lors de la mise à jour." };
  }
}
const updateFiscalSchema = z.object({
  id: z.string().min(1),
  eligible: z.enum(["YES", "NO", "TO_VERIFY"]),
  dossierStatus: z.string().min(1),
  agrementStatus: z.string().min(1),
  estimatedSavingsXOF: z.number().min(0),
});

export async function updateFiscalAdvantage(formData: z.infer<typeof updateFiscalSchema>) {
  const session = await auth();
  if (!session) return { error: "Non authentifié" };

  const role = session.user.role as Role;
  // Restriction aux décideurs (DG, COPIL, Super Admin, Chef Projet AMOA)
  const isDecisionMaker = hasPermission(role, "legal", "approve") || role === "AMOA_CHEF";
  
  if (!isDecisionMaker) {
    return { error: "Permission refusée : seuls les décideurs peuvent modifier les avantages fiscaux." };
  }

  const parsed = updateFiscalSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Données invalides" };
  }

  const { id, eligible, dossierStatus, agrementStatus, estimatedSavingsXOF } = parsed.data;

  try {
    const updated = await prisma.fiscalAdvantage.update({
      where: { id },
      data: {
        eligible,
        dossierStatus,
        agrementStatus,
        estimatedSavingsXOF: BigInt(estimatedSavingsXOF),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "FISCAL_ADVANTAGE_UPDATED",
        entityType: "FiscalAdvantage",
        entityId: id,
        metadata: { 
          category: updated.category,
          newAmount: estimatedSavingsXOF.toString()
        },
      },
    });

    revalidatePath("/legal");
    return { success: true };
  } catch (err) {
    console.error("updateFiscalAdvantage error:", err);
    return { error: "Erreur lors de la mise à jour des avantages fiscaux." };
  }
}
