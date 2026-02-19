import { z } from "zod";
import bs58 from "bs58";

/**
 * Validates a Solana public key (base58 encoded, 32-44 chars)
 */
export const isValidSolanaAddress = (address: string): boolean => {
  try {
    const decoded = bs58.decode(address);
    return decoded.length === 32;
  } catch {
    return false;
  }
};

/** Zod schema for a Solana wallet address */
export const solanaAddressSchema = z
  .string()
  .min(32, "Address too short")
  .max(44, "Address too long")
  .refine(isValidSolanaAddress, "Invalid Solana address");

/** Zod schema for wallet name */
export const walletNameSchema = z
  .string()
  .min(1, "Name is required")
  .max(32, "Name must be 32 characters or less")
  .trim();

/** Zod schema for the helius assets API request */
export const heliusAssetsRequestSchema = z.object({
  ownerAddress: solanaAddressSchema,
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(1000).default(1000),
});

/** Zod schema for the transaction history request */
export const transactionHistoryRequestSchema = z.object({
  address: solanaAddressSchema,
  before: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

/** Zod schema for leaderboard verification request */
export const verifyWalletSchema = z.object({
  walletAddress: solanaAddressSchema,
  signature: z.string().min(1, "Signature is required"),
  message: z.string().min(1, "Message is required"),
  displayName: walletNameSchema,
});
