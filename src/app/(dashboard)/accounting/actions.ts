"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Role } from "@prisma/client";

const CATEGORIES_DEPENSE = ["MATERIEL", "SERVICES", "MAIN_D_OEUVRE", "FRAIS_GENERAUX", "AUTRE_DEPENSE", "AUTRE"] as const;
const CATEGORIES_RECETTE = ["AVANCE_MARCHE", "ACOMPTE_CLIENT", "SUBVENTION", "VIREMENT_FINANCEMENT", "AUTRE_RECETTE"] as const;
const ALL_CATEGORIES = [...CATEGORIES_DEPENSE, ...CATEGORIES_RECETTE] as const;

const recordTransactionSchema = z.object({
  projectId: z.string().min(1),
  transactionType: z.enum(["DEPENSE", "RECETTE"]),
  title: z.string().min(2, "Le titre est obligatoire"),
  description: z.string().optional(),
  amountXOF: z.number().positive("Le montant doit être positif"),
  date: z.string().min(1, "La date est obligatoire"),
  category: z.enum(ALL_CATEGORIES),
  invoiceRef: z.string().optional(),
});

const approveSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["APPROUVE", "REJETE"]),
  rejectionReason: z.string().optional(),
});

export async function recordTransaction(formData: z.infer<typeof recordTransactionSchema>) {
  const session = await auth();
  if (!session) return { error: "Non authentifié" };

  const role = session.user.role as Role;
  if (!hasPermission(role, "accounting", "create")) {
    return { error: "Permission refusée." };
  }

  const parsed = recordTransactionSchema.safeParse(formData);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides";
    return { error: msg };
  }

  const { projectId, transactionType, title, description, amountXOF, date, category, invoiceRef } = parsed.data;

  try {
    const tx = await prisma.expense.create({
      data: {
        projectId,
        transactionType,
        title,
        description: description || null,
        amountXOF: BigInt(Math.round(amountXOF)),
        date: new Date(date),
        category,
        invoiceRef: invoiceRef || null,
        status: "EN_ATTENTE",
        recordedById: session.user.id,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: transactionType === "RECETTE" ? "INCOME_RECORDED" : "EXPENSE_RECORDED",
        entityType: "Expense",
        entityId: tx.id,
        metadata: { title, amountXOF, category, transactionType },
      },
    });

    revalidatePath("/accounting");
    revalidatePath("/dashboard");
    return { success: true, id: tx.id };
  } catch (err) {
    console.error("recordTransaction error:", err);
    return { error: "Erreur serveur lors de l'enregistrement." };
  }
}

export async function approveTransaction(formData: z.infer<typeof approveSchema>) {
  const session = await auth();
  if (!session) return { error: "Non authentifié" };

  const role = session.user.role as Role;
  if (!hasPermission(role, "accounting", "approve")) {
    return { error: "Permission refusée : seule la Direction Générale peut approuver." };
  }

  const parsed = approveSchema.safeParse(formData);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides";
    return { error: msg };
  }

  const { id, action, rejectionReason } = parsed.data;

  try {
    const tx = await prisma.expense.findUnique({ where: { id } });
    if (!tx) return { error: "Transaction introuvable." };
    if (tx.status !== "EN_ATTENTE") return { error: "Cette transaction a déjà été traitée." };

    await prisma.expense.update({
      where: { id },
      data: {
        status: action,
        approvedById: session.user.id,
        approvedAt: new Date(),
        rejectionReason: action === "REJETE" ? (rejectionReason || "Non spécifié") : null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: action === "APPROUVE" ? "TX_APPROVED" : "TX_REJECTED",
        entityType: "Expense",
        entityId: id,
        metadata: { title: tx.title, action, transactionType: tx.transactionType },
      },
    });

    revalidatePath("/accounting");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("approveTransaction error:", err);
    return { error: "Erreur serveur lors de la validation." };
  }
}

export async function deleteTransaction(id: string) {
  const session = await auth();
  if (!session) return { error: "Non authentifié" };

  const role = session.user.role as Role;
  if (!hasPermission(role, "accounting", "delete")) {
    return { error: "Permission refusée." };
  }

  try {
    await prisma.expense.delete({ where: { id } });
    revalidatePath("/accounting");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("deleteTransaction error:", err);
    return { error: "Erreur serveur lors de la suppression." };
  }
}
