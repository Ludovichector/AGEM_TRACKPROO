"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Shield, Activity, Settings, ChevronRight } from "lucide-react";
import { ROLE_COLORS, ROLE_LABELS } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";
import type { Role } from "@prisma/client";

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  organization: string | null;
  createdAt: string;
  lastActiveAt: string | null;
}

interface ActivityRow {
  id: string;
  action: string;
  module: string;
  userId: string;
  userName: string;
  userRole: Role;
  createdAt: string;
}

interface AdminPageClientProps {
  users: UserRow[];
  recentActivity: ActivityRow[];
}

const TABS = [
  { id: "users", label: "Utilisateurs", icon: Users },
  { id: "activity", label: "Audit Log", icon: Activity },
  { id: "settings", label: "Paramètres", icon: Settings },
] as const;

type Tab = (typeof TABS)[number]["id"];

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  evm: "EVM",
  planning: "Planning",
  risks: "Risques",
  tasks: "Tâches",
  legal: "Juridique",
  documents: "Documents",
  communication: "Communication",
  rse: "RSE",
  admin: "Administration",
};

export function AdminPageClient({ users, recentActivity }: AdminPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Administration
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Gestion des utilisateurs, permissions et audit du système
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Utilisateurs actifs", value: users.length, color: "var(--status-info)" },
          { label: "Rôles distincts", value: new Set(users.map((u) => u.role)).size, color: "var(--agem-gold)" },
          { label: "Organisations", value: new Set(users.map((u) => u.organization).filter(Boolean)).size, color: "#8B5CF6" },
          { label: "Actions (24h)", value: recentActivity.length, color: "var(--status-success)" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border p-4"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
          >
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: "var(--bg-elevated)" }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: activeTab === tab.id ? "var(--bg-card)" : "transparent",
                color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow: activeTab === tab.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Users tab */}
      {activeTab === "users" && (
        <div className="space-y-3">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un utilisateur…"
              className="w-full max-w-sm px-4 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
              }}
            />
          </div>

          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div
              className="grid grid-cols-12 gap-3 px-4 py-2.5 text-xs font-semibold"
              style={{
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-muted)",
              }}
            >
              <span className="col-span-4">Utilisateur</span>
              <span className="col-span-3">Rôle</span>
              <span className="col-span-3 hidden lg:block">Organisation</span>
              <span className="col-span-2 text-right">Inscrit</span>
            </div>

            {filteredUsers.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="grid grid-cols-12 gap-3 px-4 py-3 items-center border-t hover:bg-opacity-50 transition-colors"
                style={{
                  borderColor: "var(--border-subtle)",
                  backgroundColor: "var(--bg-card)",
                }}
              >
                <div className="col-span-4 flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: ROLE_COLORS[user.role] }}
                  >
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {user.fullName}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="col-span-3">
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: `${ROLE_COLORS[user.role]}15`,
                      color: ROLE_COLORS[user.role],
                    }}
                  >
                    {ROLE_LABELS[user.role]}
                  </span>
                </div>
                <div className="col-span-3 hidden lg:block">
                  <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                    {user.organization ?? "-"}
                  </p>
                </div>
                <div className="col-span-2 text-right">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Activity log tab */}
      {activeTab === "activity" && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div
            className="px-4 py-2.5 text-xs font-semibold grid grid-cols-12 gap-3"
            style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-muted)" }}
          >
            <span className="col-span-3">Utilisateur</span>
            <span className="col-span-2">Module</span>
            <span className="col-span-5">Action</span>
            <span className="col-span-2 text-right">Date</span>
          </div>
          {recentActivity.map((log, i) => (
            <div
              key={log.id}
              className="grid grid-cols-12 gap-3 px-4 py-3 border-t items-center"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
            >
              <div className="col-span-3 flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: ROLE_COLORS[log.userRole] }}
                >
                  {log.userName.charAt(0)}
                </div>
                <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                  {log.userName}
                </span>
              </div>
              <div className="col-span-2">
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-muted)" }}
                >
                  {MODULE_LABELS[log.module] ?? log.module}
                </span>
              </div>
              <div className="col-span-5">
                <p className="text-xs truncate" style={{ color: "var(--text-primary)" }}>
                  {log.action}
                </p>
              </div>
              <div className="col-span-2 text-right">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {formatDateTime(log.createdAt)}
                </p>
              </div>
            </div>
          ))}
          {recentActivity.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Aucune activité récente</p>
            </div>
          )}
        </div>
      )}

      {/* Settings tab */}
      {activeTab === "settings" && (
        <div className="space-y-3">
          {[
            { label: "Informations du projet", desc: "Nom, code, dates, budget global" },
            { label: "Gestion des permissions", desc: "Matrice rôles × modules × actions" },
            { label: "Intégrations", desc: "Webhooks, exports, connexions tierces" },
            { label: "Sécurité", desc: "Politique de mots de passe, sessions actives" },
            { label: "Notifications", desc: "Templates email, fréquences d'alertes" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-4 rounded-xl border hover:shadow-sm transition-all cursor-pointer"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {item.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {item.desc}
                </p>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
