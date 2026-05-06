import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { computeEvm } from "@/lib/evm";
import { EvmPageClient } from "@/components/evm/EvmPageClient";

export default async function EvmPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (!hasPermission(session.user.role, "evm", "view")) {
    return (
      <div className="p-6">
        <p style={{ color: "var(--status-danger)" }}>Accès non autorisé.</p>
      </div>
    );
  }

  const project = await prisma.project.findUnique({ where: { code: "OBF-SIEGE-2026" } });
  if (!project) redirect("/dashboard");

  const entries = await prisma.evmMonthlyEntry.findMany({
    where: { projectId: project.id },
    include: { enteredBy: { select: { fullName: true, role: true } } },
    orderBy: { monthNumber: "asc" },
  });

  const entriesWithEvm = entries.map((e) => {
    const evm = computeEvm({
      pv: e.pvCumulXOF,
      ev: e.evCumulXOF,
      ac: e.acCumulXOF,
      bac: e.bacXOF,
      physicalProgress: e.physicalProgress,
    });
    return {
      id: e.id,
      monthNumber: e.monthNumber,
      monthDate: e.monthDate.toISOString(),
      pvCumulXOF: e.pvCumulXOF.toString(),
      evCumulXOF: e.evCumulXOF.toString(),
      acCumulXOF: e.acCumulXOF.toString(),
      bacXOF: e.bacXOF.toString(),
      physicalProgress: e.physicalProgress,
      notes: e.notes,
      validatedAt: e.validatedAt?.toISOString() ?? null,
      enteredBy: e.enteredBy.fullName,
      cpi: evm.cpi,
      spi: evm.spi,
      cpiZone: evm.cpiZone,
      penaltyPct: evm.penaltyPct,
      eacXOF: evm.eac?.toString() ?? null,
      alertLevel: evm.alertLevel,
      alertMessage: evm.alertMessage,
    };
  });

  const canEdit = hasPermission(session.user.role, "evm", "edit");
  const canExport = hasPermission(session.user.role, "evm", "export");

  return (
    <EvmPageClient
      entries={entriesWithEvm}
      projectId={project.id}
      bacXOF={project.totalBudgetXOF.toString()}
      durationMonths={project.durationMonths}
      startDate={project.startDate.toISOString()}
      canEdit={canEdit}
      canExport={canExport}
      userId={session.user.id}
    />
  );
}
