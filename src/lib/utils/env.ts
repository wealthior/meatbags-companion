import { z } from "zod";

const serverEnvSchema = z.object({
  HELIUS_API_KEY: z.string().min(1, "HELIUS_API_KEY is required"),
  POSTGRES_URL: z.string().optional(),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SOLANA_NETWORK: z
    .enum(["mainnet-beta", "devnet", "testnet"])
    .default("mainnet-beta"),
  NEXT_PUBLIC_COLLECTION_ADDRESS: z.string().min(1),
});

/**
 * Validated server-side environment variables.
 * Only call from server-side code (API routes, server components).
 */
export const getServerEnv = () => {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Missing server environment variables: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}`
    );
  }
  return parsed.data;
};

/**
 * Validated client-side environment variables.
 * Safe to use in browser code.
 */
export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK,
  NEXT_PUBLIC_COLLECTION_ADDRESS: process.env.NEXT_PUBLIC_COLLECTION_ADDRESS,
});
