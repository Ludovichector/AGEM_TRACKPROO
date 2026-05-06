import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { AccountingPageClient } from "@/components/accounting/AccountingPageClient";
import type { Role } from "@prisma/client";

export default async function AccountingPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = session.user.role as Role;
  if (!hasPermission(role, "accounting", "view")) {
    return (
      <div className="p-8 text-center">
        <p className="text-[var(--text-muted)]">Accès non autorisé à ce module.</p>
      </div>
    );
  }

  const project = await prisma.project.findUnique({
    where: { code: "OBF-SIEGE-2026" },
    select: { id: true, name: true },
  });

  if (!project) {
    return <div className="p-8"><p className="text-[var(--text-muted)]">Projet non trouvé.</p></div>;
  }

  const transactions = await prisma.expense.findMany({
    where: { projectId: project.id },
    include: {
      recordedBy: { select: { id: true, fullName: true, role: true } },
      approvedBy: { select: { id: true, fullName: true } },
    },
    orderBy: { date: "desc" },
  });

  const approved = transactions.filter((t) => t.status === "APPROUVE");
  const recettesApproved = approved.filter((t) => t.transactionType === "RECETTE");
  const depensesApproved = approved.filter((t) => t.transactionType === "DEPENSE");
  const pending = transactions.filter((t) => t.status === "EN_ATTENTE");

  const totalRecettes = recettesApproved.reduce((acc, t) => acc + t.amountXOF, BigInt(0));
  const totalDepenses = depensesApproved.reduce((acc, t) => acc + t.amountXOF, BigInt(0));
  const solde = totalRecettes - totalDepenses;

  const byCategoryDepense = depensesApproved.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] ?? BigInt(0)) + t.amountXOF;
    return acc;
  }, {} as Record<string, bigint>);

  const byCategoryRecette = recettesApproved.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] ?? BigInt(0)) + t.amountXOF;
    return acc;
  }, {} as Record<string, bigint>);

  const serialized = transactions.map((t) => ({
    id: t.id,
    transactionType: t.transactionType as "DEPENSE" | "RECETTE",
    title: t.title,
    description: t.description,
    amountXOF: t.amountXOF.toString(),
    date: t.date.toISOString(),
    category: t.category,
    status: t.status,
    invoiceRef: t.invoiceRef,
    rejectionReason: t.rejectionReason,
    createdAt: t.createdAt.toISOString(),
    approvedAt: t.approvedAt?.toISOString() ?? null,
    recordedBy: { id: t.recordedBy.id, fullName: t.recordedBy.fullName, role: t.recordedBy.role },
    approvedBy: t.approvedBy ? { id: t.approvedBy.id, fullName: t.approvedBy.fullName } : null,
  }));

  return (
    <AccountingPageClient
      projectId={project.id}
      projectName={project.name}
      transactions={serialized}
      stats={{
        totalRecettesXOF: totalRecettes.toString(),
        totalDepensesXOF: totalDepenses.toString(),
        soldeXOF: solde.toString(),
        pendingCount: pending.length,
        totalCount: transactions.length,
        byCategoryDepense: Object.fromEntries(Object.entries(byCategoryDepense).map(([k, v]) => [k, v.toString()])),
        byCategoryRecette: Object.fromEntries(Object.entries(byCategoryRecette).map(([k, v]) => [k, v.toString()])),
      }}
      canCreate={hasPermission(role, "accounting", "create")}
      canApprove={hasPermission(role, "accounting", "approve")}
      canDelete={hasPermission(role, "accounting", "delete")}
    />
  );
}
