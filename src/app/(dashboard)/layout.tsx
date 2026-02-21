"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useUiStore } from "@/stores/ui-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen } = useUiStore();
  const [hydrated, setHydrated] = useState(false);

  // Wait for Zustand persist hydration to avoid SSR mismatch
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Desktop sidebar width (mobile uses 0 — sidebar is an overlay)
  const desktopMargin = hydrated ? (sidebarOpen ? 220 : 60) : 220;

  return (
    <div className="min-h-screen bg-bg-void bg-grid">
      <Sidebar />
      <div
        id="dashboard-content"
        className="transition-[margin-left] duration-200"
      >
        <Header />
        <main className="p-4 md:p-6 min-h-[calc(100vh-56px-40px)]">{children}</main>
        <Footer />
      </div>
      {/* Mobile: no margin. Desktop: sidebar pushes content */}
      <style>{`
        #dashboard-content { margin-left: 0; }
        @media (min-width: 1024px) {
          #dashboard-content { margin-left: ${desktopMargin}px; }
        }
      `}</style>
    </div>
  );
}
