"use client";

import { motion } from "framer-motion";
import { Construction, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface WipBannerProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * Apocalyptic Work-in-Progress banner with animated effects.
 * Displays a glitchy, radioactive-styled construction notice.
 */
export function WipBanner({
  title = "Under Construction",
  subtitle = "This sector is being rebuilt. Stay tuned, survivor.",
  className,
}: WipBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative overflow-hidden rounded-lg border border-rust/30 bg-gradient-to-br from-rust/5 via-bg-surface to-gold/5",
        className,
      )}
    >
      {/* Animated scan line */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-rust/40 to-transparent"
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* Hazard stripes top */}
      <div className="h-1.5 w-full bg-repeating-stripe" />

      <div className="px-6 py-8 sm:py-10 flex flex-col items-center text-center relative">
        {/* Pulsing icon */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, -5, 5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative mb-5"
        >
          <div className="w-16 h-16 rounded-full bg-rust/10 border-2 border-rust/30 flex items-center justify-center">
            <Construction size={28} className="text-rust" />
          </div>
          {/* Radioactive glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-rust/20"
            animate={{
              scale: [1, 1.6],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        </motion.div>

        {/* Glitching title */}
        <h3
          className="glitch text-base sm:text-lg font-bold uppercase tracking-widest text-rust mb-2"
          data-text={title}
        >
          {title}
        </h3>

        {/* Typed subtitle */}
        <p className="text-xs text-text-muted max-w-sm leading-relaxed">
          {subtitle}
        </p>

        {/* Warning badges */}
        <div className="flex items-center gap-3 mt-5">
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-gold/20 bg-gold/5 text-[9px] text-gold uppercase tracking-widest font-medium"
          >
            <AlertTriangle size={10} />
            Work in Progress
          </motion.span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-rust/20 bg-rust/5 text-[9px] text-rust uppercase tracking-widest font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rust rad-pulse" />
            ETA Unknown
          </span>
        </div>
      </div>

      {/* Hazard stripes bottom */}
      <div className="h-1.5 w-full bg-repeating-stripe" />
    </motion.div>
  );
}
