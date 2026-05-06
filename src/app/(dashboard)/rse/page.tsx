import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { RsePageClient } from "@/components/rse/RsePageClient";

export default async function RsePage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, "rse", "view")) {
    return <div className="p-6"><p style={{ color: "var(--status-danger)" }}>Accès non autorisé.</p></div>;
  }

  const project = await prisma.project.findUnique({ where: { code: "OBF-SIEGE-2026" } });
  if (!project) redirect("/dashboard");

  const [entries, certifications] = await Promise.all([
    prisma.rseIndicator.findMany({
      where: { projectId: project.id },
      orderBy: { monthNumber: "asc" },
    }),
    prisma.certification.findMany({
      where: { projectId: project.id },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="overflow-y-auto h-full">
      <RsePageClient
        entries={entries.map((e) => ({
          id: e.id,
          monthNumber: e.monthNumber,
          carbonTotalTCO2eq: e.carbonTotalTCO2eq,
          carbonMonthlyTCO2eq: e.carbonMonthlyTCO2eq,
          reductionVsBenchmarkPct: e.reductionVsBenchmarkPct,
          localMaterialsPct: e.localMaterialsPct,
          localWorkforcePct: e.localWorkforcePct,
          wasteValorizationPct: e.wasteValorizationPct,
        }))}
        certifications={certifications.map((c) => ({
          id: c.id,
          name: c.name,
          status: c.status,
          progressPct: c.progressPct,
          targetLevel: c.targetLevel,
          selectionPhase: c.selectionPhase,
          auditor: c.auditor,
        }))}
      />
    </div>
  );
}
