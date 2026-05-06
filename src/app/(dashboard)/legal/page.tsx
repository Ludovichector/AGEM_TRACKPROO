import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { computeLegalCountdown, computeConstruction36Months } from "@/lib/legal";
import { LegalPageClient } from "@/components/legal/LegalPageClient";

export default async function LegalPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (!hasPermission(session.user.role, "legal", "view")) {
    return <div className="p-6"><p style={{ color: "var(--status-danger)" }}>Accès non autorisé.</p></div>;
  }

  const project = await prisma.project.findUnique({ where: { code: "OBF-SIEGE-2026" } });
  if (!project) redirect("/dashboard");

  const [legalTracker, legalActions, fiscalAdvantages] = await Promise.all([
    prisma.legalTracker.findUnique({ where: { projectId: project.id } }),
    prisma.legalAction.findMany({ where: { projectId: project.id }, orderBy: { position: "asc" } }),
    prisma.fiscalAdvantage.findMany({ where: { projectId: project.id }, orderBy: { position: "asc" } }),
  ]);

  const legalCountdown = computeLegalCountdown();
  const construction36 = computeConstruction36Months(
    legalTracker?.counter36MonthsStarted ?? false,
    legalTracker?.counter36MonthsStartDate ?? null,
  );

  const canEdit = hasPermission(session.user.role, "legal", "edit");

  return (
    <LegalPageClient
      legalCountdown={{
        daysRemaining: legalCountdown.daysRemaining,
        totalLegalDays: legalCountdown.totalLegalDays,
        progressionPct: legalCountdown.progressionPct,
        alertLevel: legalCountdown.alertLevel,
        alertLabel: legalCountdown.alertLabel,
        alertColor: legalCountdown.alertColor,
        deadline: legalCountdown.deadline.toISOString(),
      }}
      construction36={{
        isStarted: construction36.isStarted,
        monthsElapsed: construction36.monthsElapsed,
        monthsRemaining: construction36.monthsRemaining,
        constructionProgressVsTimePct: construction36.constructionProgressVsTimePct,
        deadlineDate: construction36.deadlineDate?.toISOString() ?? null,
        startDate: construction36.startDate?.toISOString() ?? null,
      }}
      legalTracker={legalTracker ? {
        dossierCompletenessPct: legalTracker.dossierCompletenessPct,
        authorizationsObtained: legalTracker.authorizationsObtained,
        authorizationsRequired: legalTracker.authorizationsRequired,
        fiscalDossiersDeposited: legalTracker.fiscalDossiersDeposited,
        fiscalDossiersTotal: legalTracker.fiscalDossiersTotal,
      } : null}
      legalActions={legalActions.map((a) => ({
        id: a.id,
        title: a.title,
        phase: a.phase,
        deadline: a.deadline,
        responsible: a.responsible,
        status: a.status,
        notes: a.notes,
        position: a.position,
      }))}
      fiscalAdvantages={fiscalAdvantages.map((f) => ({
        id: f.id,
        category: f.category,
        eligible: f.eligible,
        dossierStatus: f.dossierStatus,
        agrementStatus: f.agrementStatus,
        estimatedSavingsXOF: f.estimatedSavingsXOF.toString(),
      }))}
      canEdit={canEdit}
      canApprove={hasPermission(session.user.role, "legal", "approve") || session.user.role === "AMOA_CHEF"}
      projectId={project.id}
    />
  );
}
