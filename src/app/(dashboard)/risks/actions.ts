"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Role, RiskStatus } from "@prisma/client";

const updateRiskStatusSchema = z.object({
  riskId: z.string().min(1),
  status: z.enum(["UNDER_CONTROL", "MONITORING", "ESCALATED", "CLOSED"]),
  comment: z.string().optional(),
});

export async function updateRiskStatus(formData: z.infer<typeof updateRiskStatusSchema>) {
  const session = await auth();
  if (!session) return { error: "Non authentifié" };

  const role = session.user.role as Role;
  // Utilisation de la permission 'approve' pour restreindre aux décideurs (DG, AMOA Chef, Super Admin)
  if (!hasPermission(role, "risks", "approve")) {
    return { error: "Permission refusée : seuls les décideurs peuvent modifier le statut d'un risque." };
  }

  const parsed = updateRiskStatusSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Données invalides" };
  }

  const { riskId, status, comment } = parsed.data;

  try {
    const risk = await prisma.risk.findUnique({ where: { id: riskId } });
    if (!risk) return { error: "Risque introuvable" };

    // Mise à jour du risque et création d'une mise à jour historique simultanée
    const [updatedRisk] = await prisma.$transaction([
      prisma.risk.update({
        where: { id: riskId },
        data: { status },
      }),
      prisma.riskUpdate.create({
        data: {
          riskId,
          authorId: session.user.id,
          comment: comment || `Changement de statut : ${risk.status} → ${status}`,
          newStatus: status,
        },
      }),
      prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "RISK_STATUS_UPDATED",
          entityType: "Risk",
          entityId: riskId,
          metadata: { 
            title: risk.title, 
            oldStatus: risk.status, 
            newStatus: status 
          },
        },
      }),
    ]);

    revalidatePath("/risks");
    revalidatePath("/dashboard");
    return { success: true, status: updatedRisk.status };
  } catch (err) {
    console.error("updateRiskStatus error:", err);
    return { error: "Erreur serveur lors de la mise à jour du risque." };
  }
}
