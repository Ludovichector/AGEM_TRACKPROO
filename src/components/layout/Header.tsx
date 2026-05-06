"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Menu,
} from "lucide-react";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/permissions";
import type { Role } from "@prisma/client";
import { formatDate } from "@/lib/format";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { data: session } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const role = session?.user?.role as Role | undefined;
  const today = new Date();

  return (
    <header
      className={`flex items-center justify-between px-4 lg:px-8 h-16 shrink-0 sticky top-0 z-40 transition-all duration-300 ${
        scrolled 
          ? "glass border-b border-[var(--border-subtle)] shadow-sm" 
          : "bg-transparent border-b border-transparent"
      }`}
    >
      {/* Gauche : bouton mobile + info projet */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm hover:shadow-md transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex flex-col">
          <p className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            OBF-SIEGE-2026
          </p>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {formatDate(today)}
          </p>
        </div>
      </div>

      {/* Droite : Notifications + Avatar */}
      <div className="flex items-center gap-3">
        {/* Cloche notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm hover:shadow-md transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span
              className="absolute top-2 right-2 w-2 h-2 rounded-full border-2 border-[var(--bg-card)]"
              style={{ backgroundColor: "var(--status-danger)" }}
            />
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-14 w-80 rounded-2xl border shadow-xl z-50 p-4 bg-[var(--bg-card)] border-[var(--border-subtle)]"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-[var(--text-primary)]">
                    Notifications
                  </p>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--agem-gold)]/10 text-[var(--agem-gold)] text-xs font-bold">1 nv.</span>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex gap-3 items-start p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-[var(--status-danger)] mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-1">Validation requise</p>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-1">Mise à jour du budget M1</p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/dashboard#notifications"
                  onClick={() => setNotifOpen(false)}
                  className="block text-center w-full py-2 text-xs font-semibold text-[var(--agem-gold)] hover:text-[var(--agem-gold-dark)] bg-[var(--agem-gold)]/5 rounded-lg transition-colors"
                >
                  Voir toutes les notifications
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Menu utilisateur */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm hover:shadow-md transition-all group"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-inner"
              style={{
                backgroundColor: role ? ROLE_COLORS[role] : "var(--agem-gold)",
                color: "#FFFFFF",
              }}
            >
              {session?.user?.name?.charAt(0) ?? "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold leading-tight text-[var(--text-primary)] group-hover:text-[var(--agem-gold)] transition-colors">
                {session?.user?.name?.split(" ").slice(0, 2).join(" ") ?? "Utilisateur"}
              </p>
              {role && (
                <p className="text-[10px] uppercase font-semibold tracking-wider leading-tight text-[var(--text-muted)]">
                  {ROLE_LABELS[role].split(" ").slice(0, 2).join(" ")}
                </p>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 hidden sm:block text-[var(--text-muted)] transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-14 w-56 rounded-2xl border shadow-xl z-50 p-2 bg-[var(--bg-card)] border-[var(--border-subtle)]"
              >
                <div className="px-3 py-2 mb-2 border-b border-[var(--border-subtle)] sm:hidden">
                  <p className="text-sm font-bold text-[var(--text-primary)]">{session?.user?.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{role ? ROLE_LABELS[role] : ""}</p>
                </div>
                
                <div className="space-y-1">
                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-primary)]"
                  >
                    <User className="w-4 h-4 text-[var(--text-muted)]" />
                    Mon profil
                  </Link>
                  <Link
                    href="/admin/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-primary)]"
                  >
                    <Settings className="w-4 h-4 text-[var(--text-muted)]" />
                    Paramètres
                  </Link>
                </div>
                
                <div className="h-px my-2 mx-2 bg-[var(--border-subtle)]" />
                
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    signOut({ callbackUrl: "/login" });
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-600 dark:text-red-400 group"
                >
                  <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  Déconnexion
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
