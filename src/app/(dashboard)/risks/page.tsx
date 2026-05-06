import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { RisksPageClient } from "@/components/risks/RisksPageClient";

export default async function RisksPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, "risks", "view")) {
    return <div className="p-6"><p style={{ color: "var(--status-danger)" }}>Accès non autorisé.</p></div>;
  }

  const project = await prisma.project.findUnique({ where: { code: "OBF-SIEGE-2026" } });
  if (!project) redirect("/dashboard");

  const risks = await prisma.risk.findMany({
    where: { projectId: project.id },
    include: { updates: { include: { author: { select: { fullName: true } } }, orderBy: { createdAt: "desc" }, take: 3 } },
    orderBy: [{ status: "asc" }, { score: "desc" }],
  });

  const canEdit = hasPermission(session.user.role, "risks", "edit");
  const canApprove = hasPermission(session.user.role, "risks", "approve");

  return (
    <RisksPageClient
      risks={risks.map((r) => ({
        id: r.id,
        title: r.title,
        probability: r.probability,
        impact: r.impact,
        score: r.score,
        mitigation: r.mitigation,
        status: r.status,
        ownerId: r.ownerId,
        createdAt: r.createdAt.toISOString(),
        updates: r.updates.map((u) => ({
          id: u.id,
          comment: u.comment,
          newStatus: u.newStatus,
          authorName: u.author.fullName,
          createdAt: u.createdAt.toISOString(),
        })),
      }))}
      canEdit={canEdit}
      canApprove={canApprove}
      projectId={project.id}
      userId={session.user.id}
    />
  );
}
