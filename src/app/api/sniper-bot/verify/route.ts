import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { z } from "zod";
import { ok, err } from "@/types/api";
import { heliusRpcUrl, PUBLIC_RPC_URL } from "@/lib/utils/constants";
import { fetchCurrentSolPrice } from "@/lib/api/price-service";

export const maxDuration = 30;

const verifySchema = z.object({
  signature: z.string().min(1, "Transaction signature is required"),
  walletAddress: z.string().min(32).max(44),
});

/** Minimum payment threshold: $1 minus 5% tolerance for price fluctuation */
const MIN_USD = 0.95;

/**
 * POST /api/sniper-bot/verify
 *
 * Verifies an on-chain SOL transfer to the payment wallet,
 * then returns the Discord invite link if valid.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        err("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join(", ")),
        { status: 400 },
      );
    }

    const { signature, walletAddress } = parsed.data;

    // Validate env config
    const discordLink = process.env.DISCORD_INVITE_URL;
    const paymentWallet = process.env.NEXT_PUBLIC_PAYMENT_WALLET;

    if (!discordLink || !paymentWallet) {
      return NextResponse.json(
        err("CONFIG_ERROR", "Payment gateway not configured"),
        { status: 500 },
      );
    }

    let paymentPubkey: PublicKey;
    try {
      paymentPubkey = new PublicKey(paymentWallet);
    } catch {
      return NextResponse.json(
        err("CONFIG_ERROR", "Invalid payment wallet address"),
        { status: 500 },
      );
    }

    // Build RPC connection (Helius primary, public fallback)
    const apiKey = process.env.HELIUS_API_KEY ?? process.env.NEXT_PUBLIC_HELIUS_KEY;
    const rpcUrl = apiKey ? heliusRpcUrl(apiKey) : PUBLIC_RPC_URL;
    const connection = new Connection(rpcUrl, "confirmed");

    // Fetch the on-chain transaction with retries.
    // After client-side confirmTransaction(), the RPC node may not have
    // the full transaction indexed yet. Retry a few times with backoff.
    const MAX_RETRIES = 5;
    const RETRY_DELAY_MS = 2_000;

    let tx: Awaited<ReturnType<typeof connection.getTransaction>> = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      tx = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });
      if (tx) break;
      // Wait before next attempt (skip wait on last attempt)
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }

    if (!tx) {
      return NextResponse.json(
        err("PAYMENT_NOT_FOUND", "Transaction not found on-chain after multiple attempts. Please try verifying again.", true),
        { status: 404 },
      );
    }

    // Check transaction succeeded
    if (tx.meta?.err) {
      return NextResponse.json(
        err("PAYMENT_INVALID", "Transaction failed on-chain"),
        { status: 400 },
      );
    }

    // Find the payment wallet in account keys and verify transfer amount
    const accountKeys = tx.transaction.message.staticAccountKeys ?? [];
    const recipientIndex = accountKeys.findIndex(
      (key) => key.toBase58() === paymentPubkey.toBase58(),
    );

    if (recipientIndex === -1) {
      return NextResponse.json(
        err("PAYMENT_INVALID", "Transaction does not include payment to the correct wallet"),
        { status: 400 },
      );
    }

    // Verify sender matches claimed wallet
    const senderIndex = accountKeys.findIndex(
      (key) => key.toBase58() === walletAddress,
    );

    if (senderIndex === -1) {
      return NextResponse.json(
        err("PAYMENT_INVALID", "Transaction sender does not match your wallet"),
        { status: 400 },
      );
    }

    // Calculate received amount from balance changes
    const preBalance = tx.meta?.preBalances[recipientIndex] ?? 0;
    const postBalance = tx.meta?.postBalances[recipientIndex] ?? 0;
    const receivedLamports = postBalance - preBalance;
    const receivedSol = receivedLamports / LAMPORTS_PER_SOL;

    // Fetch current price to verify USD value
    const priceResult = await fetchCurrentSolPrice();
    if (!priceResult.success) {
      return NextResponse.json(
        err("PRICE_FEED_UNAVAILABLE", "Could not verify payment amount — price feed down", true),
        { status: 502 },
      );
    }

    const receivedUsd = receivedSol * priceResult.data.usd;

    if (receivedUsd < MIN_USD) {
      return NextResponse.json(
        err(
          "PAYMENT_INSUFFICIENT",
          `Payment too low: received $${receivedUsd.toFixed(4)} (minimum $${MIN_USD.toFixed(2)})`,
        ),
        { status: 400 },
      );
    }

    // All checks passed — return the Discord link
    return NextResponse.json(ok({ discordLink }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json(
      err("PAYMENT_INVALID", message),
      { status: 500 },
    );
  }
}
