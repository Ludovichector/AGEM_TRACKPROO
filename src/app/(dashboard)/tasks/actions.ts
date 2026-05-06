"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function moveTask(taskId: string, targetColumnId: string, newPosition: number) {
  const session = await auth();
  if (!session) {
    return { success: false, error: "Non authentifié" };
  }

  const role = session.user.role;
  const canEdit = hasPermission(role, "tasks", "edit");
  const canApprove = hasPermission(role, "tasks", "approve");

  if (!canEdit) {
    return { success: false, error: "Permission refusée pour modifier cette tâche." };
  }

  try {
    // Récupérer la tâche actuelle
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { column: true },
    });

    if (!task) {
      return { success: false, error: "Tâche introuvable." };
    }

    // Récupérer la colonne de destination
    const targetColumn = await prisma.column.findUnique({
      where: { id: targetColumnId },
    });

    if (!targetColumn) {
      return { success: false, error: "Colonne de destination introuvable." };
    }

    // Vérification : Si la colonne est "Terminé" (Validation requise)
    // On se base sur le nom pour l'instant (robuste) ou on pourrait ajouter un booléen en DB.
    if (targetColumn.name.toLowerCase() === "terminé" && !canApprove) {
      return { 
        success: false, 
        error: "Action bloquée : Seul un responsable (ex: Chef de Projet) peut valider une tâche en 'Terminé'." 
      };
    }

    // Réorganiser les tâches dans l'ancienne et nouvelle colonne
    // 1. Décrémenter les positions dans l'ancienne colonne si on change de colonne
    if (task.columnId !== targetColumnId) {
      await prisma.task.updateMany({
        where: {
          columnId: task.columnId,
          position: { gt: task.position },
        },
        data: { position: { decrement: 1 } },
      });

      // 2. Incrémenter les positions dans la nouvelle colonne
      await prisma.task.updateMany({
        where: {
          columnId: targetColumnId,
          position: { gte: newPosition },
        },
        data: { position: { increment: 1 } },
      });
    } else {
      // Même colonne, ajustement des positions
      if (newPosition > task.position) {
        await prisma.task.updateMany({
          where: {
            columnId: task.columnId,
            position: { gt: task.position, lte: newPosition },
          },
          data: { position: { decrement: 1 } },
        });
      } else if (newPosition < task.position) {
        await prisma.task.updateMany({
          where: {
            columnId: task.columnId,
            position: { gte: newPosition, lt: task.position },
          },
          data: { position: { increment: 1 } },
        });
      }
    }

    // Mettre à jour la tâche
    await prisma.task.update({
      where: { id: taskId },
      data: {
        columnId: targetColumnId,
        position: newPosition,
        // Si elle va dans Terminé, on met completedAt
        completedAt: targetColumn.name.toLowerCase() === "terminé" ? new Date() : null,
      },
    });

    revalidatePath("/tasks");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Erreur moveTask:", error);
    return { success: false, error: "Erreur serveur lors du déplacement." };
  }
}

export async function assignTask(taskId: string, assigneeId: string | null) {
  const session = await auth();
  if (!session) {
    return { success: false, error: "Non authentifié" };
  }

  const role = session.user.role;
  const canEdit = hasPermission(role, "tasks", "edit");
  const canApprove = hasPermission(role, "tasks", "approve");

  // Seuls les rôles pouvant approuver (managers) ou créer peuvent assigner de manière robuste
  if (!canEdit) {
    return { success: false, error: "Permission refusée." };
  }

  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { assigneeId },
    });
    
    revalidatePath("/tasks");
    return { success: true };
  } catch (error) {
    console.error("Erreur assignTask:", error);
    return { success: false, error: "Erreur lors de l'assignation de la tâche." };
  }
}

export async function createTask(data: {
  title: string;
  description?: string;
  boardId: string;
  assigneeId?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
}) {
  const session = await auth();
  if (!session) return { success: false, error: "Non authentifié" };

  const role = session.user.role;
  if (!hasPermission(role, "tasks", "create")) {
    return { success: false, error: "Permission refusée de créer des tâches." };
  }

  try {
    // Trouver la première colonne du board pour y placer la tâche (ex: "À faire")
    const firstColumn = await prisma.column.findFirst({
      where: { boardId: data.boardId },
      orderBy: { position: "asc" },
    });

    if (!firstColumn) {
      return { success: false, error: "Le tableau Kanban n'a pas de colonne." };
    }

    // Trouver la position la plus élevée dans cette colonne
    const lastTask = await prisma.task.findFirst({
      where: { columnId: firstColumn.id },
      orderBy: { position: "desc" },
    });
    
    const newPosition = lastTask ? lastTask.position + 1 : 0;

    const newTask = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assigneeId: data.assigneeId || null,
        columnId: firstColumn.id,
        position: newPosition,
        createdById: session.user.id,
        progressPct: 0,
      },
      include: {
        assignee: { select: { id: true, fullName: true, role: true } },
        _count: { select: { comments: true, attachments: true, checklist: true } },
      }
    });

    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    
    // Renvoyer les données de la nouvelle tâche pour maj optimiste
    return { 
      success: true, 
      task: {
        id: newTask.id,
        title: newTask.title,
        description: newTask.description,
        position: newTask.position,
        priority: newTask.priority,
        dueDate: newTask.dueDate?.toISOString() || null,
        labels: newTask.labels,
        progressPct: newTask.progressPct,
        assignee: newTask.assignee,
        commentCount: newTask._count.comments,
        attachmentCount: newTask._count.attachments,
        checklistTotal: newTask._count.checklist,
        columnId: newTask.columnId,
      } 
    };
  } catch (error) {
    console.error("Erreur createTask:", error);
    return { success: false, error: "Erreur serveur lors de la création de la tâche." };
  }
}
