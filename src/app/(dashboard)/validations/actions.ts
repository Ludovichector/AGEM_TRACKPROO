"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitValidation(formData: FormData) {
  const session = await auth();
  if (!session || !session.user.role.startsWith("AMOA")) {
    throw new Error("Accès non autorisé");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const milestoneId = formData.get("milestoneId") as string;
  const documentUrl = formData.get("documentUrl") as string;
  const reviewersIds = formData.getAll("reviewers") as string[];
  
  if (!title || reviewersIds.length === 0) {
    throw new Error("Titre et validateurs requis");
  }

  const project = await prisma.project.findUnique({
    where: { code: "OBF-SIEGE-2026" },
  });

  if (!project) throw new Error("Projet introuvable");

  await prisma.clientValidation.create({
    data: {
      projectId: project.id,
      title,
      description,
      milestoneId: milestoneId || null,
      documentUrl: documentUrl || null,
      status: "PENDING",
      submittedById: session.user.id,
      assignedReviewers: {
        connect: reviewersIds.map(id => ({ id }))
      }
    }
  });

  revalidatePath("/validations");
  return { success: true };
}
