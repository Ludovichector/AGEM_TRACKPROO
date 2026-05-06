import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ValidationsClient } from "@/components/dashboard/ValidationsClient";

export const metadata = {
  title: "Validations Client | AGEM TrackPro",
  description: "Approbation des jalons et livrables",
};

export default async function ValidationsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const project = await prisma.project.findUnique({
    where: { code: "OBF-SIEGE-2026" },
  });

  if (!project) redirect("/dashboard");

  const validations = await prisma.clientValidation.findMany({
    where: { projectId: project.id },
    orderBy: { submittedAt: "desc" },
    include: {
      submittedBy: {
        select: {
          fullName: true,
          role: true,
        }
      },
      reviewedBy: {
        select: {
          fullName: true,
        }
      },
      reserves: {
        include: {
          resolvedBy: {
            select: {
              fullName: true,
            }
          }
        }
      }
    }
  });

  const clientUsers = await prisma.user.findMany({
    where: {
      role: {
        in: ["MOA_DG", "MOA_COPIL"]
      }
    },
    select: {
      id: true,
      fullName: true,
      role: true,
    }
  });

  const milestones = await prisma.milestone.findMany({
    where: {
      phase: {
        projectId: project.id
      }
    },
    select: {
      id: true,
      title: true,
      monthNumber: true,
    },
    orderBy: {
      monthNumber: "asc"
    }
  });

  const formattedValidations = validations.map(v => ({
    id: v.id,
    title: v.title,
    description: v.description,
    status: v.status,
    documentUrl: v.documentUrl,
    submittedAt: v.submittedAt.toISOString(),
    submittedBy: {
      name: v.submittedBy.fullName,
      role: v.submittedBy.role,
    },
    reviewedAt: v.reviewedAt?.toISOString() || null,
    reviewedBy: v.reviewedBy?.fullName || null,
    comment: v.comment,
    reserves: v.reserves.map(r => ({
      id: r.id,
      category: r.category,
      description: r.description,
      priority: r.priority,
      createdAt: r.createdAt.toISOString(),
      resolvedAt: r.resolvedAt?.toISOString() || null,
      resolvedBy: r.resolvedBy?.fullName || null,
    }))
  }));

  return (
    <ValidationsClient 
      validations={formattedValidations} 
      userRole={session.user.role}
      clientUsers={clientUsers}
      milestones={milestones}
    />
  );
}
