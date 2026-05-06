"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <SessionProvider>
      <div className="flex h-full" style={{ backgroundColor: "var(--bg-canvas)" }}>
        {/* Sidebar desktop */}
        <div className="hidden lg:flex h-full shrink-0">
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Overlay mobile */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-64"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar
                isCollapsed={false}
                onToggle={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <Header onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
