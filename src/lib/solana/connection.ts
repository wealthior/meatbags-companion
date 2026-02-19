import { Connection } from "@solana/web3.js";
import { heliusRpcUrl, PUBLIC_RPC_URL } from "@/lib/utils/constants";

let heliusConnection: Connection | null = null;
let publicConnection: Connection | null = null;
let heliusFailCount = 0;
const HELIUS_CIRCUIT_BREAKER_THRESHOLD = 3;
const HELIUS_COOLDOWN_MS = 60_000;
let heliusCooldownUntil = 0;

/**
 * Create or return a cached Helius RPC connection
 */
const getHeliusConnection = (apiKey: string): Connection => {
  if (!heliusConnection) {
    heliusConnection = new Connection(heliusRpcUrl(apiKey), {
      commitment: "confirmed",
    });
  }
  return heliusConnection;
};

/**
 * Create or return a cached public Solana RPC connection
 */
const getPublicConnection = (): Connection => {
  if (!publicConnection) {
    publicConnection = new Connection(PUBLIC_RPC_URL, {
      commitment: "confirmed",
    });
  }
  return publicConnection;
};

/**
 * Get the best available RPC connection.
 * Uses Helius as primary, falls back to public RPC on failure.
 * Implements circuit breaker pattern.
 */
export const getRpcConnection = (apiKey?: string): Connection => {
  const now = Date.now();

  if (apiKey && (heliusFailCount < HELIUS_CIRCUIT_BREAKER_THRESHOLD || now > heliusCooldownUntil)) {
    return getHeliusConnection(apiKey);
  }

  return getPublicConnection();
};

/**
 * Report a Helius RPC failure (increments circuit breaker)
 */
export const reportHeliusFailure = (): void => {
  heliusFailCount += 1;
  if (heliusFailCount >= HELIUS_CIRCUIT_BREAKER_THRESHOLD) {
    heliusCooldownUntil = Date.now() + HELIUS_COOLDOWN_MS;
  }
};

/**
 * Report a Helius RPC success (resets circuit breaker)
 */
export const reportHeliusSuccess = (): void => {
  heliusFailCount = 0;
};

/**
 * Reset all connections (useful for testing)
 */
export const resetConnections = (): void => {
  heliusConnection = null;
  publicConnection = null;
  heliusFailCount = 0;
  heliusCooldownUntil = 0;
};
