"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import type { ApiResult } from "@/types/api";
import type { SolPrice } from "@/types/price";
import { clientEnv } from "@/lib/utils/env";

export type PaymentStatus =
  | "idle"
  | "fetching-price"
  | "signing"
  | "confirming"
  | "verifying"
  | "success"
  | "error";

interface SolPaymentState {
  readonly status: PaymentStatus;
  readonly solAmount: number | null;
  readonly txSignature: string | null;
  readonly discordLink: string | null;
  readonly error: string | null;
  /** True when a TX was sent but verification hasn't succeeded yet. */
  readonly hasPendingPayment: boolean;
  readonly pay: () => Promise<void>;
  readonly retryVerification: () => Promise<void>;
  readonly reset: () => void;
}

const PAYMENT_USD = 1.0;

/** Payment wallet address from validated client env. */
const PAYMENT_WALLET = clientEnv.NEXT_PUBLIC_PAYMENT_WALLET;

// ── localStorage persistence ────────────────────────────────────────────────
// Payments are stored per-wallet so switching wallets shows the correct state.
// Structure: { signature, walletAddress, discordLink?, solAmount, timestamp }

const STORAGE_PREFIX = "sniper-bot:payment:";

interface StoredPayment {
  readonly signature: string;
  readonly walletAddress: string;
  readonly discordLink: string | null;
  readonly solAmount: number;
  readonly timestamp: number;
}

function getStoredPayment(walletAddress: string): StoredPayment | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + walletAddress);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPayment;
    // Basic sanity check
    if (!parsed.signature || !parsed.walletAddress) return null;
    return parsed;
  } catch {
    return null;
  }
}

function savePayment(data: StoredPayment): void {
  try {
    localStorage.setItem(
      STORAGE_PREFIX + data.walletAddress,
      JSON.stringify(data),
    );
  } catch {
    // Best-effort — localStorage may be full or disabled
  }
}

// ── Hook ────────────────────────────────────────────────────────────────────

/**
 * Hook that handles the full SOL payment flow for Discord access.
 *
 * **Persistence guarantees:**
 * - TX signature is saved to localStorage IMMEDIATELY after on-chain confirmation
 *   (before server verification). If the browser crashes, the signature survives.
 * - Discord link is saved to localStorage after successful verification.
 * - On page load / wallet reconnect, the hook auto-restores from localStorage:
 *   → If discordLink exists → status = "success" (no network call needed)
 *   → If signature exists but no discordLink → status = "error" with retry option
 * - `retryVerification()` re-sends the saved signature to the server.
 * - Once a TX is sent, the user can NEVER accidentally trigger a new payment.
 *
 * Flow: fetch price → create tx → sign → confirm → [save sig] → verify → [save link] → reveal
 */
export const useSolPayment = (): SolPaymentState => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [solAmount, setSolAmount] = useState<number | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [discordLink, setDiscordLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track whether we already restored from localStorage for this wallet
  const restoredWalletRef = useRef<string | null>(null);

  // ── Restore from localStorage when wallet connects ──
  useEffect(() => {
    if (!publicKey) return;

    const walletAddress = publicKey.toBase58();

    // Only restore once per wallet connection
    if (restoredWalletRef.current === walletAddress) return;
    restoredWalletRef.current = walletAddress;

    const stored = getStoredPayment(walletAddress);
    if (!stored) return;

    // Restore common state
    setTxSignature(stored.signature);
    setSolAmount(stored.solAmount);

    if (stored.discordLink) {
      // Payment fully verified — show success immediately
      setDiscordLink(stored.discordLink);
      setStatus("success");
      setError(null);
    } else {
      // Payment sent but never verified — let user retry
      setDiscordLink(null);
      setStatus("error");
      setError(
        "Previous payment found but verification incomplete. Click Retry Verification below.",
      );
    }
  }, [publicKey]);

  // ── Derived state ──
  const hasPendingPayment = txSignature !== null && discordLink === null;

  // ── Server verification call (used by both pay flow and retry) ──
  const verifyOnServer = useCallback(
    async (signature: string, walletAddress: string): Promise<string> => {
      const verifyRes = await fetch("/api/sniper-bot/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature, walletAddress }),
      });

      const verifyData: ApiResult<{ discordLink: string }> =
        await verifyRes.json();

      if (!verifyData.success) {
        throw new Error(verifyData.error.message);
      }

      return verifyData.data.discordLink;
    },
    [],
  );

  // ── Reset (only clears in-memory error state, NEVER touches localStorage) ──
  const reset = useCallback(() => {
    // SAFETY: If there's a saved TX signature, do NOT allow reset to idle.
    // The user must retry verification, not start a new payment.
    if (txSignature && !discordLink) return;

    setStatus("idle");
    setSolAmount(null);
    setTxSignature(null);
    setDiscordLink(null);
    setError(null);
  }, [txSignature, discordLink]);

  // ── Retry verification for a previously sent TX ──
  const retryVerification = useCallback(async () => {
    if (!publicKey || !txSignature) return;

    const walletAddress = publicKey.toBase58();

    try {
      setStatus("verifying");
      setError(null);

      const link = await verifyOnServer(txSignature, walletAddress);

      // Save to localStorage — payment is now fully verified
      const stored = getStoredPayment(walletAddress);
      savePayment({
        signature: txSignature,
        walletAddress,
        discordLink: link,
        solAmount: stored?.solAmount ?? 0,
        timestamp: stored?.timestamp ?? Date.now(),
      });

      setDiscordLink(link);
      setStatus("success");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Verification failed";
      setError(message);
      setStatus("error");
    }
  }, [publicKey, txSignature, verifyOnServer]);

  // ── Full payment flow ──
  const pay = useCallback(async () => {
    if (!publicKey) {
      setError("Wallet not connected");
      setStatus("error");
      return;
    }

    // SAFETY: Block new payment if there's already a pending one
    if (txSignature && !discordLink) {
      setError(
        "You already have a pending payment. Use Retry Verification instead.",
      );
      setStatus("error");
      return;
    }

    if (!PAYMENT_WALLET) {
      setError("Payment wallet not configured");
      setStatus("error");
      return;
    }

    let paymentPubkey: PublicKey;
    try {
      paymentPubkey = new PublicKey(PAYMENT_WALLET);
    } catch {
      setError("Invalid payment wallet address");
      setStatus("error");
      return;
    }

    try {
      // 1. Fetch current SOL price
      setStatus("fetching-price");
      setError(null);

      const priceRes = await fetch("/api/price");
      const priceData: ApiResult<SolPrice> = await priceRes.json();
      if (!priceData.success) throw new Error("Failed to fetch SOL price");

      const solPrice = priceData.data.usd;
      const amount = PAYMENT_USD / solPrice;
      setSolAmount(amount);

      // 2. Create and send transaction
      setStatus("signing");

      const lamports = Math.ceil(amount * LAMPORTS_PER_SOL);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: paymentPubkey,
          lamports,
        }),
      );

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      setTxSignature(signature);

      // 3. Confirm on-chain
      setStatus("confirming");

      const confirmation = await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed",
      );

      if (confirmation.value.err) {
        throw new Error("Transaction failed on-chain");
      }

      // ★ CRITICAL: Save signature to localStorage IMMEDIATELY after on-chain
      // confirmation, BEFORE server verification. If the browser crashes now,
      // the user can still come back and retry verification.
      const walletAddress = publicKey.toBase58();
      savePayment({
        signature,
        walletAddress,
        discordLink: null,
        solAmount: amount,
        timestamp: Date.now(),
      });

      // 4. Verify with server and get Discord link
      setStatus("verifying");

      const link = await verifyOnServer(signature, walletAddress);

      // Save verified payment to localStorage
      savePayment({
        signature,
        walletAddress,
        discordLink: link,
        solAmount: amount,
        timestamp: Date.now(),
      });

      setDiscordLink(link);
      setStatus("success");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";

      // Detect user rejection (wallet popup closed — no TX sent)
      if (
        message.includes("User rejected") ||
        message.includes("rejected the request")
      ) {
        setError("Transaction cancelled by user");
        // User rejected = no TX was sent, so clear the signature
        setTxSignature(null);
      } else {
        setError(message);
      }
      setStatus("error");
    }
  }, [publicKey, connection, sendTransaction, txSignature, discordLink, verifyOnServer]);

  return {
    status,
    solAmount,
    txSignature,
    discordLink,
    error,
    hasPendingPayment,
    pay,
    retryVerification,
    reset,
  };
};
