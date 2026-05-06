import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { PlanningPageClient } from "@/components/planning/PlanningPageClient";

export default async function PlanningPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, "planning", "view")) {
    return <div className="p-6"><p style={{ color: "var(--status-danger)" }}>Accès non autorisé.</p></div>;
  }

  const project = await prisma.project.findUnique({ where: { code: "OBF-SIEGE-2026" } });
  if (!project) redirect("/dashboard");

  const phases = await prisma.phase.findMany({
    where: { projectId: project.id },
    include: { milestones: { orderBy: { monthNumber: "asc" } } },
    orderBy: { number: "asc" },
  });

  return (
    <PlanningPageClient
      phases={phases.map((p) => ({
        id: p.id,
        number: p.number,
        name: p.name,
        startMonth: p.startMonth,
        endMonth: p.endMonth,
        durationMonths: p.durationMonths,
        description: p.description,
        progressPct: p.progressPct,
        milestones: p.milestones.map((m) => ({
          id: m.id,
          monthNumber: m.monthNumber,
          title: m.title,
          criticality: m.criticality,
          status: m.status,
          achievedAt: m.achievedAt?.toISOString() ?? null,
        })),
      }))}
      durationMonths={project.durationMonths}
      startDate={project.startDate.toISOString()}
    />
  );
}
