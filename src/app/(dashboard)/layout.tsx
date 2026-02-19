"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
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

  // During SSR and initial render, use the default sidebar width to match server HTML
  const marginLeft = hydrated ? (sidebarOpen ? 220 : 60) : 220;

  return (
    <div className="min-h-screen bg-bg-void bg-grid">
      <Sidebar />
      <div
        className="transition-[margin-left] duration-200"
        style={{ marginLeft }}
      >
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
