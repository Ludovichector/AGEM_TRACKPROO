"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function uploadReport(formData: FormData) {
  const session = await auth();
  if (!session || !session.user.role.startsWith("AMOA")) {
    throw new Error("Accès non autorisé");
  }

  const title = formData.get("title") as string;
  const period = formData.get("period") as string;
  const type = formData.get("type") as "WEEKLY_FLASH" | "MONTHLY" | "MILESTONE" | "CUSTOM";
  const fileUrl = formData.get("fileUrl") as string; // in a real app, handle file blob and upload to S3
  
  if (!title || !period || !type || !fileUrl) {
    throw new Error("Tous les champs sont requis");
  }

  const project = await prisma.project.findUnique({
    where: { code: "OBF-SIEGE-2026" },
  });

  if (!project) throw new Error("Projet introuvable");

  // 1. Trouver ou créer le dossier "Rapports AMOA" dans la GED
  let folder = await prisma.folder.findFirst({
    where: {
      projectId: project.id,
      name: "Rapports AMOA",
    }
  });

  if (!folder) {
    folder = await prisma.folder.create({
      data: {
        projectId: project.id,
        name: "Rapports AMOA",
      }
    });
  }

  // 2. Créer le Document dans la GED
  const document = await prisma.document.create({
    data: {
      folderId: folder.id,
      name: title,
      fileUrl: fileUrl,
      fileType: fileUrl.split('.').pop()?.toUpperCase() || "PDF",
      fileSize: 1024, // Mock size for now
      uploadedById: session.user.id,
      tags: ["Rapport", type]
    }
  });

  // 3. Créer l'entrée dans les Rapports et la lier au document
  await prisma.report.create({
    data: {
      projectId: project.id,
      title,
      period,
      type,
      fileUrl: document.fileUrl,
      documentId: document.id,
      status: "GENERATED",
      createdById: session.user.id,
      generatedAt: new Date()
    }
  });

  revalidatePath("/reports");
  return { success: true };
}
