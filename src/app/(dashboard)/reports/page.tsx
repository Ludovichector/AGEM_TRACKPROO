import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ReportsClient } from "@/components/dashboard/ReportsClient";

export const metadata = {
  title: "Rapports Automatiques | AGEM TrackPro",
  description: "Rapports de chantier et tableaux de bord",
};

export default async function ReportsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const project = await prisma.project.findUnique({
    where: { code: "OBF-SIEGE-2026" },
  });

  if (!project) redirect("/dashboard");

  const reports = await prisma.report.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: {
          fullName: true,
        }
      }
    }
  });

  const formattedReports = reports.map(r => ({
    id: r.id,
    type: r.type,
    title: r.title,
    period: r.period,
    status: r.status,
    fileUrl: r.fileUrl,
    generatedAt: r.generatedAt?.toISOString() || null,
    sentAt: r.sentAt?.toISOString() || null,
    createdAt: r.createdAt.toISOString(),
    createdBy: r.createdBy.fullName,
  }));

  return <ReportsClient reports={formattedReports} userRole={session.user.role} />;
}
