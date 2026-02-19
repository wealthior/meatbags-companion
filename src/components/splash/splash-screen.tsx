"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[9998] bg-bg-void flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background radiation pulse */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.12, 0.04, 0.1, 0.06] }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(57,255,20,0.15)_0%,_rgba(57,255,20,0.03)_40%,_transparent_70%)]"
          />

          {/* Scanlines */}
          <div className="absolute inset-0 scanlines pointer-events-none opacity-60" />

          {/* Toxic T-Bone — main star */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3, rotate: -15 }}
            animate={{
              opacity: [0, 1, 0.7, 1],
              scale: [0.3, 1.08, 0.95, 1],
              rotate: [-15, 3, -1, 0],
            }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-48 h-48 mb-2"
          >
            {/* Glow ring behind T-Bone */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.6, 0.3], scale: [0.5, 1.3, 1.1] }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(57,255,20,0.2)_0%,_transparent_70%)] blur-xl"
            />
            <Image
              src="/toxic-t-bone_transparent.png"
              alt="Toxic T-Bone"
              fill
              className="object-contain drop-shadow-[0_0_40px_rgba(57,255,20,0.3)] relative z-10"
              priority
            />
          </motion.div>

          {/* MeatBags logo + text */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
            className="flex items-center gap-3 mb-1"
          >
            <Image
              src="/meatbags-logo_transparent.png"
              alt="MeatBags Logo"
              width={36}
              height={36}
              priority
            />
            <Image
              src="/meatbags-text-logo.png"
              alt="MeatBags"
              width={160}
              height={36}
              className="object-contain"
              priority
            />
          </motion.div>

          {/* Companion Terminal */}
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.8em" }}
            animate={{ opacity: 1, letterSpacing: "0.4em" }}
            transition={{ delay: 1.0, duration: 0.5 }}
            className="text-text-muted text-[10px] uppercase mt-3"
          >
            Companion Terminal
          </motion.p>

          {/* system :: identify — glitchy typewriter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.2 }}
            className="mt-6 flex items-center gap-2"
          >
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="text-neon-green text-[10px] font-mono"
            >
              {">"}
            </motion.span>
            <span className="text-neon-green/70 text-[10px] font-mono tracking-wider">
              system :: identify
            </span>
          </motion.div>

          {/* Loading bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.9, duration: 0.2 }}
            className="mt-6 w-48"
          >
            <div className="h-[2px] bg-border-default/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ delay: 2.0, duration: 1.0, ease: "easeInOut" }}
                className="h-full bg-neon-green/60 rounded-full shadow-[0_0_8px_rgba(57,255,20,0.4)]"
              />
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.7, 0.4, 0.7] }}
              transition={{ delay: 2.0, duration: 0.6 }}
              className="text-[8px] text-text-muted/50 uppercase tracking-widest text-center mt-1.5"
            >
              Initializing...
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
