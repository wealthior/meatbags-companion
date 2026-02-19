"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
import { useWalletStore } from "@/stores/wallet-store";
import { isValidSolanaAddress } from "@/lib/utils/validation";
import { cn } from "@/lib/utils/cn";

export default function LandingPage() {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { addWallet, wallets } = useWalletStore();
  const [manualAddress, setManualAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Wait for Zustand persist hydration before making routing decisions
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Auto-add connected wallet and redirect (in useEffect to avoid render-phase side effects)
  useEffect(() => {
    if (!hydrated) return;

    if (connected && publicKey) {
      const addr = publicKey.toBase58();
      if (!useWalletStore.getState().hasWallet(addr)) {
        addWallet(addr, "Main Wallet", true);
      }
      router.push("/collection");
      return;
    }

    if (wallets.length > 0) {
      router.push("/collection");
    }
  }, [hydrated, connected, publicKey, wallets.length, addWallet, router]);

  // Show nothing until hydrated + routing decision is made
  if (!hydrated) return null;

  // If we're about to redirect, show a brief loading state instead of flashing the form
  if ((connected && publicKey) || wallets.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-void bg-grid">
        <div className="flex items-center gap-3 text-text-muted text-sm">
          <div className="w-2 h-2 rounded-full bg-neon-green rad-pulse" />
          <span className="uppercase tracking-wider typewriter">
            Entering the wasteland...
          </span>
        </div>
      </div>
    );
  }

  const handleManualSubmit = () => {
    setAddressError("");
    const trimmed = manualAddress.trim();

    if (!trimmed) {
      setAddressError("Enter a wallet address, survivor");
      return;
    }

    if (!isValidSolanaAddress(trimmed)) {
      setAddressError("Invalid Solana address. Check your coordinates.");
      return;
    }

    addWallet(trimmed, "Wallet 1", false);
    router.push("/collection");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-grid">
      {/* Background radiation effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(57,255,20,0.05)_0%,_transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-lg mx-4"
      >
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-5xl font-bold tracking-tighter text-text-primary mb-2"
          >
            <span className="text-neon-green text-glow-green">MEAT</span>
            <span className="text-rust">BAGS</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-text-muted text-sm uppercase tracking-[0.3em]"
          >
            Companion Terminal
          </motion.p>
        </div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-bg-surface/80 backdrop-blur-sm border border-border-default rounded-lg p-8 scanlines relative"
        >
          {/* Terminal header */}
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border-default">
            <div className="w-2 h-2 rounded-full bg-neon-green rad-pulse" />
            <span className="text-xs text-text-muted uppercase tracking-wider">
              system :: identify
            </span>
          </div>

          {/* Connect Wallet Button */}
          <button
            onClick={() => setVisible(true)}
            className={cn(
              "w-full py-3.5 px-4 rounded-md font-medium text-sm uppercase tracking-wider",
              "bg-neon-green/10 border border-neon-green/30 text-neon-green",
              "hover:bg-neon-green/20 hover:border-neon-green/50 hover:glow-green-strong",
              "transition-all duration-300 cursor-pointer"
            )}
          >
            Connect Wallet
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border-default" />
            <span className="text-text-muted text-xs uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border-default" />
          </div>

          {/* Manual Address Input */}
          <div className="space-y-3">
            <label className="block text-xs text-text-secondary uppercase tracking-wider">
              Enter Wallet Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualAddress}
                onChange={(e) => {
                  setManualAddress(e.target.value);
                  setAddressError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                placeholder="5v7r9k...T7Hb"
                className={cn(
                  "flex-1 bg-bg-primary border rounded-md px-3 py-2.5 text-sm",
                  "text-text-primary placeholder:text-text-muted",
                  "focus:outline-none focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/20",
                  "transition-all duration-200",
                  addressError ? "border-blood" : "border-border-default"
                )}
              />
              <button
                onClick={handleManualSubmit}
                className={cn(
                  "px-4 py-2.5 rounded-md text-sm font-medium uppercase tracking-wider",
                  "bg-rust/10 border border-rust/30 text-rust",
                  "hover:bg-rust/20 hover:border-rust/50",
                  "transition-all duration-300 cursor-pointer"
                )}
              >
                Enter
              </button>
            </div>
            {addressError && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-blood text-xs"
              >
                {addressError}
              </motion.p>
            )}
          </div>

          {/* Info text */}
          <p className="mt-6 text-[10px] text-text-muted text-center leading-relaxed">
            Connect your wallet for full access or enter any address to view holdings.
            <br />
            Split wallet support — add more wallets inside the app.
          </p>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-6 text-[10px] text-text-muted"
        >
          MeatBags Companion v0.1 :: Not affiliated with Dead Bruv
        </motion.p>
      </motion.div>
    </div>
  );
}
