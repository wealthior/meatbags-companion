"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crosshair,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Shield,
  Zap,
  DollarSign,
  Wallet,
  AlertTriangle,
  Terminal,
  RotateCcw,
} from "lucide-react";
import { GlitchText } from "@/components/shared/glitch-text";
import { StatCard } from "@/components/shared/stat-card";
import { useSolPrice } from "@/hooks/use-sol-price";
import { useSolPayment, type PaymentStatus } from "@/hooks/use-sol-payment";
import { cn } from "@/lib/utils/cn";
import { shortenAddress, formatSol } from "@/lib/utils/format";

// ── Payment step labels for terminal output ──
const PAYMENT_STEPS: { status: PaymentStatus; label: string }[] = [
  { status: "fetching-price", label: "Fetching SOL market price" },
  { status: "signing", label: "Awaiting wallet signature" },
  { status: "confirming", label: "Confirming on-chain" },
  { status: "verifying", label: "Verifying payment" },
];

const STATUS_ORDER: PaymentStatus[] = [
  "fetching-price",
  "signing",
  "confirming",
  "verifying",
  "success",
];

const isStepDone = (step: PaymentStatus, current: PaymentStatus): boolean => {
  const stepIdx = STATUS_ORDER.indexOf(step);
  const currentIdx = STATUS_ORDER.indexOf(current);
  return currentIdx > stepIdx;
};

const isStepActive = (step: PaymentStatus, current: PaymentStatus): boolean =>
  step === current;

export default function SniperBotPage() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { data: solPrice } = useSolPrice();
  const payment = useSolPayment();
  const [copied, setCopied] = useState(false);

  const isProcessing =
    payment.status !== "idle" &&
    payment.status !== "success" &&
    payment.status !== "error";

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const estimatedSol = solPrice ? 1.0 / solPrice.usd : null;

  return (
    <div className="space-y-6">
      {/* ── Hazard stripe top ── */}
      <div className="h-1 w-full bg-repeating-stripe" />

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <motion.div
          className="relative"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          <div className="w-14 h-14 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center glow-green">
            <Crosshair size={28} className="text-neon-green" />
          </div>
          {/* Expanding glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full border border-neon-green/30"
            animate={{ scale: [1, 2], opacity: [0.4, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }}
          />
        </motion.div>
        <div>
          <GlitchText
            text="SNIPER BOT"
            as="h1"
            className="text-xl text-neon-green"
          />
          <p className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">
            Underground Access // Discord Payment Gate
          </p>
        </div>
      </div>

      {/* ── Feature info cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="ACCESS FEE"
          value="$1.00"
          subValue="Paid in SOL at market rate"
          icon={DollarSign}
          accent="green"
        />
        <StatCard
          label="NETWORK"
          value="SOLANA"
          subValue="Mainnet-beta"
          icon={Shield}
          accent="purple"
        />
        <StatCard
          label="REWARD"
          value="DISCORD"
          subValue="Private server invite"
          icon={Zap}
          accent="rust"
        />
      </div>

      {/* ── Terminal payment box ── */}
      <div className="relative overflow-hidden rounded-lg border border-neon-green/20 bg-bg-primary">
        {/* Scanline overlay */}
        <div className="scanlines absolute inset-0 pointer-events-none z-10 opacity-30" />

        {/* Terminal header bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-neon-green/10 bg-bg-surface/50">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blood/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-gold/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-neon-green/80" />
          </div>
          <div className="flex items-center gap-1.5 ml-3">
            <Terminal size={11} className="text-text-muted" />
            <span className="text-[9px] text-text-muted uppercase tracking-widest font-medium">
              sniper-bot@mainnet:~/payment-gate
            </span>
          </div>
        </div>

        {/* Terminal body */}
        <div className="p-5 sm:p-6 relative z-20 min-h-[200px]">
          {/* ── State: Wallet not connected ── */}
          {!connected && (
            <div className="space-y-4 text-center py-6">
              <div className="w-16 h-16 rounded-full bg-rust/10 border border-rust/30 flex items-center justify-center mx-auto">
                <Wallet size={28} className="text-rust" />
              </div>
              <div>
                <p className="text-sm text-rust font-bold uppercase tracking-wider">
                  Wallet Not Detected
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Connect your Solana wallet to proceed with payment.
                </p>
              </div>
              <button
                onClick={() => setVisible(true)}
                className="px-6 py-2.5 rounded-lg bg-rust/10 border border-rust/30 text-rust text-xs font-bold uppercase tracking-wider hover:bg-rust/20 transition-colors cursor-pointer"
              >
                Connect Wallet
              </button>
            </div>
          )}

          {/* ── State: Ready to pay (only if no pending payment exists) ── */}
          {connected && payment.status === "idle" && !payment.hasPendingPayment && (
            <div className="space-y-5">
              {/* Wallet info */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-text-muted">{">"}</span>
                <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                <span className="text-xs text-text-secondary">
                  Connected:{" "}
                  <span className="text-neon-green font-medium">
                    {publicKey ? shortenAddress(publicKey.toBase58()) : "---"}
                  </span>
                </span>
              </div>

              {/* Price info */}
              <div className="bg-bg-surface/50 rounded-lg border border-border-default p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">SOL Price</span>
                  <span className="text-text-primary font-medium">
                    ${solPrice?.usd.toFixed(2) ?? "---"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">Payment Amount</span>
                  <span className="text-neon-green font-bold">
                    {estimatedSol ? `~${formatSol(estimatedSol, 6)} SOL` : "---"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">USD Equivalent</span>
                  <span className="text-text-primary">$1.00</span>
                </div>
              </div>

              {/* Pay button */}
              <motion.button
                onClick={payment.pay}
                disabled={!solPrice}
                className={cn(
                  "w-full py-3.5 rounded-lg text-sm font-black uppercase tracking-widest transition-all cursor-pointer",
                  "bg-neon-green/10 border-2 border-neon-green/40 text-neon-green",
                  "hover:bg-neon-green/20 hover:border-neon-green/60",
                  "disabled:opacity-30 disabled:cursor-not-allowed",
                )}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                animate={{
                  boxShadow: [
                    "0 0 5px rgba(57,255,20,0.1)",
                    "0 0 20px rgba(57,255,20,0.3)",
                    "0 0 5px rgba(57,255,20,0.1)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="flex items-center justify-center gap-2">
                  <Crosshair size={16} />
                  Initiate Payment
                </span>
              </motion.button>
            </div>
          )}

          {/* ── State: Processing ── */}
          {isProcessing && (
            <div className="space-y-3 py-2">
              <AnimatePresence mode="sync">
                {PAYMENT_STEPS.map(({ status, label }) => {
                  const done = isStepDone(status, payment.status);
                  const active = isStepActive(status, payment.status);
                  const visible = done || active;

                  if (!visible) return null;

                  return (
                    <motion.div
                      key={status}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-3"
                    >
                      <span className="text-[10px] text-text-muted select-none">
                        {">"}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-medium flex-1",
                          done ? "text-neon-green" : "text-text-primary",
                        )}
                      >
                        {label}...
                      </span>
                      {done && (
                        <Check size={14} className="text-neon-green shrink-0" />
                      )}
                      {active && (
                        <Loader2
                          size={14}
                          className="text-neon-green animate-spin shrink-0"
                        />
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {payment.solAmount && (
                <div className="text-[10px] text-text-muted mt-2 pl-5">
                  Amount: {formatSol(payment.solAmount, 6)} SOL (~$1.00)
                </div>
              )}
            </div>
          )}

          {/* ── State: Success ── */}
          {payment.status === "success" && payment.discordLink && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-5 py-2"
            >
              {/* Success header */}
              <div className="text-center space-y-1">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                  className="w-14 h-14 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center mx-auto glow-green-strong"
                >
                  <Check size={28} className="text-neon-green" />
                </motion.div>
                <p className="text-sm text-neon-green font-black uppercase tracking-wider mt-3">
                  Payment Verified
                </p>
                <p className="text-[10px] text-text-muted">
                  Access granted. Welcome to the underground.
                </p>
              </div>

              {/* Discord link box */}
              <div className="bg-neon-green/5 border border-neon-green/30 rounded-lg p-4 glow-green space-y-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">
                  Your Discord Invite
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-neon-green bg-bg-primary/50 px-3 py-2 rounded border border-neon-green/10 truncate">
                    {payment.discordLink}
                  </code>
                  <button
                    onClick={() => handleCopy(payment.discordLink!)}
                    className="p-2 rounded-lg bg-bg-primary border border-neon-green/20 text-neon-green hover:bg-neon-green/10 transition-colors shrink-0 cursor-pointer"
                    title="Copy link"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                <a
                  href={payment.discordLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-bold uppercase tracking-wider hover:bg-neon-green/20 transition-colors"
                >
                  <ExternalLink size={14} />
                  Join Discord
                </a>
              </div>

              {/* TX signature */}
              {payment.txSignature && (
                <div className="text-center">
                  <a
                    href={`https://solscan.io/tx/${payment.txSignature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-text-muted hover:text-neon-green transition-colors underline underline-offset-2"
                  >
                    View transaction on Solscan
                  </a>
                </div>
              )}
            </motion.div>
          )}

          {/* ── State: Error ── */}
          {payment.status === "error" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 py-4"
            >
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blood/5 border border-blood/20">
                <AlertTriangle size={16} className="text-rust shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs text-rust font-bold uppercase tracking-wider">
                    {payment.hasPendingPayment
                      ? "Verification Failed"
                      : "Transaction Failed"}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {payment.error}
                  </p>
                </div>
              </div>

              {/* Show TX link if payment was sent (so user can verify themselves) */}
              {payment.txSignature && (
                <div className="p-3 rounded-lg bg-bg-surface/50 border border-border-default space-y-2">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">
                    Your payment was sent — funds are safe on-chain
                  </p>
                  <a
                    href={`https://solscan.io/tx/${payment.txSignature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-neon-green hover:underline underline-offset-2 flex items-center gap-1"
                  >
                    <ExternalLink size={10} />
                    View transaction on Solscan
                  </a>
                </div>
              )}

              {payment.hasPendingPayment ? (
                /* Payment was sent — only allow retry verification, NEVER new payment */
                <button
                  onClick={payment.retryVerification}
                  className="w-full py-3 rounded-lg bg-neon-green/10 border-2 border-neon-green/40 text-neon-green text-xs font-black uppercase tracking-widest hover:bg-neon-green/20 hover:border-neon-green/60 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw size={14} />
                  Retry Verification
                </button>
              ) : (
                /* No TX sent (user rejected, config error, etc.) — safe to retry */
                <button
                  onClick={payment.reset}
                  className="w-full py-2.5 rounded-lg bg-bg-surface border border-border-default text-text-secondary text-xs font-bold uppercase tracking-wider hover:border-border-accent hover:text-text-primary transition-colors cursor-pointer"
                >
                  Try Again
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Hazard stripe bottom ── */}
      <div className="h-1 w-full bg-repeating-stripe" />

      {/* ── Disclaimer ── */}
      <p className="text-[8px] text-text-muted text-center uppercase tracking-widest leading-relaxed">
        Payments are non-refundable // All transactions verified on-chain // No
        personal data collected
      </p>
    </div>
  );
}
