import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { AdminPageClient } from "@/components/admin/AdminPageClient";

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, "admin", "view")) {
    return <div className="p-6"><p style={{ color: "var(--status-danger)" }}>Accès non autorisé.</p></div>;
  }

  const [users, recentActivity] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
    }),
    prisma.activityLog.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      include: { user: { select: { fullName: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="overflow-y-auto h-full">
      <AdminPageClient
        users={users.map((u) => ({
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          organization: u.organization,
          createdAt: u.createdAt.toISOString(),
          lastActiveAt: u.lastLoginAt?.toISOString() ?? null,
        }))}
        recentActivity={recentActivity.map((log) => ({
          id: log.id,
          action: log.action,
          module: log.entityType ?? "system",
          userId: log.userId,
          userName: log.user.fullName,
          userRole: log.user.role,
          createdAt: log.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
