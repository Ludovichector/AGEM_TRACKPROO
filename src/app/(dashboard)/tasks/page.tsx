import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { TasksPageClient } from "@/components/tasks/TasksPageClient";

export default async function TasksPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, "tasks", "view")) {
    return <div className="p-6"><p style={{ color: "var(--status-danger)" }}>Accès non autorisé.</p></div>;
  }

  const project = await prisma.project.findUnique({ where: { code: "OBF-SIEGE-2026" } });
  if (!project) redirect("/dashboard");

  const boards = await prisma.board.findMany({
    where: { projectId: project.id, isArchived: false },
    include: {
      columns: {
        orderBy: { position: "asc" },
        include: {
          tasks: {
            orderBy: { position: "asc" },
            include: {
              assignee: { select: { id: true, fullName: true, role: true } },
              _count: { select: { comments: true, attachments: true, checklist: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const canCreate = hasPermission(session.user.role, "tasks", "create");
  const canEdit = hasPermission(session.user.role, "tasks", "edit");

  const users = await prisma.user.findMany({
    select: { id: true, fullName: true, role: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <TasksPageClient
      boards={boards.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        columns: b.columns.map((col) => ({
          id: col.id,
          name: col.name,
          position: col.position,
          color: col.color,
          tasks: col.tasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            position: t.position,
            priority: t.priority,
            dueDate: t.dueDate?.toISOString() ?? null,
            labels: t.labels,
            progressPct: t.progressPct,
            assignee: t.assignee ? { id: t.assignee.id, fullName: t.assignee.fullName, role: t.assignee.role } : null,
            commentCount: t._count.comments,
            attachmentCount: t._count.attachments,
            checklistTotal: t._count.checklist,
            columnId: col.id,
          })),
        })),
      }))}
      canCreate={canCreate}
      canEdit={canEdit}
      projectId={project.id}
      userId={session.user.id}
      users={users}
    />
  );
}
