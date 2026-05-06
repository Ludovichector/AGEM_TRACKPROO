"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  LayoutDashboard,
  TrendingUp,
  Scale,
  AlertTriangle,
  Calendar,
  CheckSquare,
  Leaf,
  MessageSquare,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  ClipboardList,
  Camera,
  FileSignature,
  FileBarChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/use-permission";
import type { Module } from "@/lib/permissions";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/permissions";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  module: Module;
}

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Pilotage",
    items: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, module: "dashboard" },
      { href: "/photos", label: "Galerie Photos", icon: Camera, module: "dashboard" },
      { href: "/validations", label: "Validations Client", icon: FileSignature, module: "dashboard" },
      { href: "/reports", label: "Rapports", icon: FileBarChart, module: "dashboard" },
      { href: "/accounting", label: "Comptabilité & Dépenses", icon: TrendingUp, module: "accounting" },
      { href: "/legal", label: "Loi 022-2025", icon: Scale, module: "legal" },
      { href: "/risks", label: "Registre des risques", icon: AlertTriangle, module: "risks" },
      { href: "/planning", label: "Phases & Planning", icon: Calendar, module: "planning" },
    ],
  },
  {
    title: "Opérations",
    items: [
      { href: "/tasks", label: "Tâches & Kanban", icon: CheckSquare, module: "tasks" },
      { href: "/documents", label: "Documents GED", icon: FolderOpen, module: "documents" },
      { href: "/chat", label: "Messagerie", icon: MessageSquare, module: "chat" },
    ],
  },
  {
    title: "Conformité",
    items: [
      { href: "/rse", label: "RSE & CSRD", icon: Leaf, module: "rse" },
      { href: "/rse?tab=raci", label: "RACI", icon: ClipboardList, module: "raci" },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/admin", label: "Utilisateurs", icon: Users, module: "admin" },
      { href: "/admin/settings", label: "Paramètres", icon: Settings, module: "admin" },
    ],
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { can, role } = usePermission();

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col h-full bg-[var(--agem-black)] shadow-2xl z-50 border-r border-[var(--border-subtle)] overflow-visible"
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--agem-gold)]/5 to-transparent pointer-events-none" />

      {/* Logo + Titre */}
      <div className="flex items-center gap-4 px-5 py-6 border-b border-white/5 relative z-10">
        <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 shadow-inner">
          <Image
            src="/agem-logo.png"
            alt="AGEM"
            width={28}
            height={28}
            className="object-contain drop-shadow-md"
          />
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <p className="font-extrabold text-lg tracking-tight text-white">
                AGEM <span className="text-[var(--agem-gold)]">TrackPro</span>
              </p>
              <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">
                OBF Siège Social
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 relative z-10 scrollbar-hide">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => can(item.module, "view"));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="mb-6">
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/30"
                  >
                    {group.title}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href.split("?")[0]);

                  return (
                    <Link key={item.href} href={item.href}>
                      <motion.div
                        whileHover={{ scale: 1.02, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                          isCollapsed && "justify-center px-0"
                        )}
                      >
                        {isActive && (
                          <motion.div 
                            layoutId="activeTab"
                            className="absolute inset-0 bg-gradient-to-r from-[var(--agem-gold)]/20 to-transparent border border-[var(--agem-gold)]/30 rounded-xl"
                            initial={false}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--agem-gold)] rounded-r-full" />
                        )}

                        <item.icon className={cn(
                          "w-5 h-5 shrink-0 relative z-10 transition-colors duration-200",
                          isActive ? "text-[var(--agem-gold)]" : "text-white/40 group-hover:text-white/80"
                        )} />
                        
                        <AnimatePresence>
                          {!isCollapsed && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: "auto" }}
                              exit={{ opacity: 0, width: 0 }}
                              className={cn(
                                "text-sm font-semibold whitespace-nowrap relative z-10 transition-colors duration-200",
                                isActive ? "text-white" : "text-white/50 group-hover:text-white/90"
                              )}
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Rôle utilisateur */}
      {role && (
        <div className="px-4 py-5 border-t border-white/5 relative z-10 bg-white/[0.02]">
          <AnimatePresence>
            {!isCollapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-xl"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                  style={{ backgroundColor: ROLE_COLORS[role] }}
                />
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Connecté en tant que</p>
                  <p className="text-xs font-semibold text-white/80 truncate">
                    {ROLE_LABELS[role]}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center p-2"
              >
                <div
                  className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                  style={{ backgroundColor: ROLE_COLORS[role] }}
                  title={ROLE_LABELS[role]}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Toggle collapse */}
      <button
        onClick={onToggle}
        className="absolute -right-4 top-8 w-8 h-8 rounded-full flex items-center justify-center bg-[var(--agem-black)] border-2 border-[var(--border-subtle)] text-white/50 hover:text-white hover:border-[var(--agem-gold)] hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all duration-200 z-50 group"
        aria-label={isCollapsed ? "Étendre la barre latérale" : "Réduire la barre latérale"}
      >
        {isCollapsed ? 
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /> : 
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        }
      </button>
    </motion.aside>
  );
}
