"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Grid3X3,
  Zap,
  Trophy,
  History,
  Swords,
  Wallet,
  Crown,
  Network,
  Compass,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", shortLabel: "DB" },
  { href: "/collection", icon: Grid3X3, label: "Collection", shortLabel: "CO" },
  { href: "/prep-points", icon: Zap, label: "Prep Points", shortLabel: "PP" },
  { href: "/loserboard", icon: Trophy, label: "Loserboard", shortLabel: "LB" },
  { href: "/history", icon: History, label: "History", shortLabel: "HI" },
  { href: "/raids", icon: Swords, label: "Raids", shortLabel: "RA" },
  { href: "/leaderboard", icon: Crown, label: "Leaderboard", shortLabel: "LR" },
  { href: "/wallets", icon: Wallet, label: "Wallets", shortLabel: "WA" },
  { href: "/geocaches", icon: Compass, label: "GeoCaches", shortLabel: "GC" },
  { href: "/interactions", icon: Network, label: "Interactions", shortLabel: "IN" },
] as const;

/** Desktop sidebar — hidden on mobile */
function DesktopSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUiStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 220 : 60 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="fixed left-0 top-0 bottom-0 z-40 bg-bg-surface border-r border-border-default hidden lg:flex flex-col"
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border-default">
        {sidebarOpen ? (
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/meatbags-logo_transparent.png"
              alt="MeatBags"
              width={24}
              height={24}
              className="shrink-0"
            />
            <Image
              src="/meatbags-text-logo.png"
              alt="MeatBags"
              width={100}
              height={20}
              className="object-contain"
            />
          </Link>
        ) : (
          <Link href="/" className="flex items-center justify-center w-full">
            <Image
              src="/meatbags-logo_transparent.png"
              alt="MeatBags"
              width={28}
              height={28}
            />
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-xs uppercase tracking-wider",
                "transition-all duration-200 group relative",
                isActive
                  ? "bg-neon-green/10 text-neon-green border border-neon-green/20"
                  : "text-text-muted hover:text-text-primary hover:bg-bg-hover border border-transparent"
              )}
            >
              <item.icon
                size={16}
                className={cn(
                  "shrink-0",
                  isActive ? "text-neon-green" : "text-text-muted group-hover:text-text-secondary"
                )}
              />
              {sidebarOpen && (
                <span className="truncate">{item.label}</span>
              )}

              {isActive && (
                <motion.div
                  layoutId="sidebar-active-desktop"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-neon-green rounded-r"
                />
              )}

              {!sidebarOpen && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-bg-elevated border border-border-default rounded text-[10px] text-text-primary opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="h-10 flex items-center justify-center border-t border-border-default text-text-muted hover:text-text-primary transition-colors cursor-pointer"
      >
        {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </motion.aside>
  );
}

/** Mobile sidebar — overlay drawer */
function MobileSidebar() {
  const pathname = usePathname();
  const { mobileSidebarOpen, closeMobileSidebar } = useUiStore();

  return (
    <AnimatePresence>
      {mobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-bg-void/80 backdrop-blur-sm lg:hidden"
            onClick={closeMobileSidebar}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[260px] bg-bg-surface border-r border-border-default flex flex-col lg:hidden"
          >
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-border-default">
              <Link
                href="/"
                onClick={closeMobileSidebar}
                className="flex items-center gap-2"
              >
                <Image
                  src="/meatbags-logo_transparent.png"
                  alt="MeatBags"
                  width={24}
                  height={24}
                  className="shrink-0"
                />
                <Image
                  src="/meatbags-text-logo.png"
                  alt="MeatBags"
                  width={100}
                  height={20}
                  className="object-contain"
                />
              </Link>
              <button
                onClick={closeMobileSidebar}
                className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileSidebar}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-xs uppercase tracking-wider",
                      "transition-all duration-200 group relative",
                      isActive
                        ? "bg-neon-green/10 text-neon-green border border-neon-green/20"
                        : "text-text-muted hover:text-text-primary hover:bg-bg-hover border border-transparent"
                    )}
                  >
                    <item.icon
                      size={16}
                      className={cn(
                        "shrink-0",
                        isActive ? "text-neon-green" : "text-text-muted group-hover:text-text-secondary"
                      )}
                    />
                    <span className="truncate">{item.label}</span>

                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-mobile"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-neon-green rounded-r"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/** Combined sidebar export */
export function Sidebar() {
  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
}
