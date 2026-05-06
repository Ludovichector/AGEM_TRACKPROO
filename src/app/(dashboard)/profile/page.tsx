import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ROLE_COLORS, ROLE_LABELS } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      activityLogs: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!user) redirect("/login");

  const initials = user.fullName
    .split(" ")
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Mon Profil
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Informations personnelles et activité récente
        </p>
      </div>

      {/* Profile card */}
      <div
        className="rounded-xl border p-6 flex items-start gap-5"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0"
          style={{ backgroundColor: ROLE_COLORS[user.role] }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {user.fullName}
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{user.email}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: `${ROLE_COLORS[user.role]}15`,
                color: ROLE_COLORS[user.role],
              }}
            >
              {ROLE_LABELS[user.role]}
            </span>
            {user.organization && (
              <span
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-muted)" }}
              >
                {user.organization}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div
        className="rounded-xl border divide-y"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        {[
          { label: "Nom complet", value: user.fullName },
          { label: "Email", value: user.email },
          { label: "Rôle", value: ROLE_LABELS[user.role] },
          { label: "Organisation", value: user.organization ?? "-" },
          { label: "Membre depuis", value: new Date(user.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) },
          { label: "Dernière activité", value: user.lastLoginAt ? formatDateTime(user.lastLoginAt.toISOString()) : "-" },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>{row.label}</span>
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      {user.activityLogs.length > 0 && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div
            className="px-5 py-3.5 border-b"
            style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }}
          >
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Activité récente
            </h3>
          </div>
          <div className="divide-y" style={{ backgroundColor: "var(--bg-card)" }}>
            {user.activityLogs.map((log) => (
              <div
                key={log.id}
                className="px-5 py-3 flex items-center justify-between"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                  {log.action}
                </p>
                <span className="text-xs ml-4 shrink-0" style={{ color: "var(--text-muted)" }}>
                  {formatDateTime(log.createdAt.toISOString())}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
