import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { computeLegalCountdown } from "@/lib/legal";
import { formatXOF, formatDate, formatMonth } from "@/lib/format";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { ClientDashboardClient } from "@/components/dashboard/ClientDashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Récupérer les données projet
  const project = await prisma.project.findUnique({
    where: { code: "OBF-SIEGE-2026" },
    include: {
      legalTracker: true,
      phases: { include: { milestones: { orderBy: { monthNumber: "asc" } } } },
    },
  });

  if (!project) {
    return (
      <div className="p-6">
        <p style={{ color: "var(--text-muted)" }}>Projet non trouvé.</p>
      </div>
    );
  }

  // Dépenses Comptables
  const expenses = await prisma.expense.findMany({
    where: { projectId: project.id },
  });

  const totalApproved = expenses
    .filter(e => e.status === "APPROUVE")
    .reduce((acc, curr) => acc + curr.amountXOF, BigInt(0));

  const pendingApprovalsCount = expenses.filter(e => e.status === "EN_ATTENTE").length;

  // Risques élevés
  const criticalRisks = await prisma.risk.count({
    where: { projectId: project.id, score: { gte: 6 }, status: { not: "CLOSED" } },
  });

  const highRisks = await prisma.risk.count({
    where: { projectId: project.id, score: { gte: 3 }, status: { not: "CLOSED" } },
  });

  // Tâches de l'utilisateur courant
  const myTasks = await prisma.task.findMany({
    where: { assigneeId: session.user.id, completedAt: null },
    include: { column: { include: { board: true } } },
    orderBy: { dueDate: "asc" },
    take: 5,
  });

  // Activité récente
  const recentActivity = await prisma.activityLog.findMany({
    include: { user: { select: { fullName: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  // Retrait EVM

  // Compteur légal
  const legalCountdown = computeLegalCountdown();

  // Prochain jalon
  const nextMilestone = project.phases
    .flatMap((p) => p.milestones)
    .filter((m) => m.status === "PENDING" || m.status === "IN_PROGRESS")
    .sort((a, b) => a.monthNumber - b.monthNumber)[0] ?? null;

  // Mois courant du projet
  const startDate = new Date(project.startDate);
  const now = new Date();
  const monthsElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  const currentMonth = Math.max(1, Math.min(project.durationMonths, monthsElapsed + 1));

  const data = {
    project: {
      id: project.id,
      code: project.code,
      name: project.name,
      client: project.client,
      totalBudgetXOF: project.totalBudgetXOF.toString(),
      startDate: project.startDate.toISOString(),
      durationMonths: project.durationMonths,
      status: project.status,
    },
    currentMonth,
    accounting: {
      totalApprovedXOF: totalApproved.toString(),
      pendingApprovalsCount,
    },
    legalCountdown: {
      daysRemaining: legalCountdown.daysRemaining,
      totalLegalDays: legalCountdown.totalLegalDays,
      progressionPct: legalCountdown.progressionPct,
      alertLevel: legalCountdown.alertLevel,
      alertLabel: legalCountdown.alertLabel,
      alertColor: legalCountdown.alertColor,
    },
    legalTracker: project.legalTracker ? {
      dossierCompletenessPct: project.legalTracker.dossierCompletenessPct,
      authorizationsObtained: project.legalTracker.authorizationsObtained,
      authorizationsRequired: project.legalTracker.authorizationsRequired,
    } : null,
    criticalRisks,
    highRisks,
    myTasks: myTasks.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      dueDate: t.dueDate?.toISOString() ?? null,
      boardName: t.column.board.name,
    })),
    nextMilestone: nextMilestone ? {
      monthNumber: nextMilestone.monthNumber,
      title: nextMilestone.title,
      criticality: nextMilestone.criticality,
      status: nextMilestone.status,
    } : null,
    user: {
      id: session.user.id,
      role: session.user.role,
      name: session.user.name ?? "",
    },
  };

  const isClient = session.user.role === "MOA_DG" || session.user.role === "MOA_COPIL";

  if (isClient) {
    const projectHealth = await prisma.projectHealthScore.findFirst({
      where: { projectId: project.id },
      orderBy: { date: "desc" },
    });

    const recentPhotos = await prisma.sitePhoto.findMany({
      where: { projectId: project.id },
      orderBy: { takenAt: "desc" },
      take: 3,
    });

    const clientData = {
      project: {
        id: project.id,
        code: project.code,
        name: project.name,
        client: project.client,
        totalBudgetXOF: project.totalBudgetXOF.toString(),
        startDate: project.startDate.toISOString(),
        durationMonths: project.durationMonths,
        status: project.status,
      },
      currentMonth,
      projectHealth,
      recentPhotos: recentPhotos.map(p => ({
        id: p.id,
        zone: p.zone,
        thumbnailUrl: p.thumbnailUrl,
        fileUrl: p.fileUrl,
        takenAt: p.takenAt.toISOString(),
      })),
      criticalRisks,
      nextMilestone: nextMilestone ? {
        monthNumber: nextMilestone.monthNumber,
        title: nextMilestone.title,
        status: nextMilestone.status,
      } : null,
      user: {
        id: session.user.id,
        role: session.user.role,
        name: session.user.name ?? "",
      },
    };

    return <ClientDashboardClient data={clientData} />;
  }

  return <DashboardClient data={data} />;
}
