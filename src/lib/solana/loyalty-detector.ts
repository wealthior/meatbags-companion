import type { LoyaltyMultiplier } from "@/types/nft";
import type { ApiResult } from "@/types/api";
import { ok, err } from "@/types/api";
import { heliusDasUrl, PRESALE_START, PRESALE_END, PUBLIC_MINT_START, PUBLIC_MINT_END } from "@/lib/utils/constants";
import { reportHeliusFailure, reportHeliusSuccess } from "./connection";

interface MintOrigin {
  readonly mintAddress: string;
  readonly minterWallet: string;
  readonly mintTimestamp: number;
}

/**
 * Fetch the original mint signature for an NFT using Helius DAS getSignaturesForAsset.
 * Returns the earliest signature (the mint transaction).
 */
const fetchMintSignature = async (
  apiKey: string,
  mintAddress: string
): Promise<string | null> => {
  try {
    const response = await fetch(heliusDasUrl(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "mint-origin",
        method: "getSignaturesForAsset",
        params: {
          id: mintAddress,
          page: 1,
          limit: 1,
          sortDirection: "asc",
        },
      }),
    });

    if (!response.ok) {
      reportHeliusFailure();
      return null;
    }

    const data = await response.json();
    reportHeliusSuccess();

    const items = data.result?.items;
    if (!items || items.length === 0) return null;

    // items are [signature, operationType] tuples
    return items[0][0] as string;
  } catch {
    reportHeliusFailure();
    return null;
  }
};

/**
 * Parse mint transactions using Helius Enhanced Transactions API.
 * Batch up to 100 signatures per call.
 */
const parseMintTransactions = async (
  apiKey: string,
  signatures: string[]
): Promise<Map<string, { feePayer: string; timestamp: number }>> => {
  const result = new Map<string, { feePayer: string; timestamp: number }>();

  try {
    const response = await fetch(
      `https://api.helius.xyz/v0/transactions?api-key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: signatures }),
      }
    );

    if (!response.ok) {
      reportHeliusFailure();
      return result;
    }

    const data = (await response.json()) as Array<{
      signature: string;
      feePayer: string;
      timestamp: number;
      type?: string;
    }>;
    reportHeliusSuccess();

    for (const tx of data) {
      result.set(tx.signature, {
        feePayer: tx.feePayer,
        timestamp: tx.timestamp,
      });
    }
  } catch {
    reportHeliusFailure();
  }

  return result;
};

/**
 * Determine the loyalty multiplier for a single NFT.
 */
export const detectNftMultiplier = (
  currentOwner: string,
  minter: string,
  mintTimestamp: number
): LoyaltyMultiplier => {
  // If current owner didn't mint it, they bought on secondary
  if (currentOwner !== minter) return 1.0;

  // Owner is the original minter — check mint phase
  if (mintTimestamp >= PRESALE_START && mintTimestamp <= PRESALE_END) {
    return 1.2;
  }
  if (mintTimestamp >= PUBLIC_MINT_START && mintTimestamp <= PUBLIC_MINT_END) {
    return 1.1;
  }

  // Timestamp doesn't match known phases (airdrop, edge case)
  return 1.0;
};

/**
 * Detect the loyalty multiplier for a wallet based on its NFT holdings.
 * Takes the highest multiplier across all held NFTs.
 *
 * @param apiKey - Helius API key
 * @param ownerAddress - The wallet address to detect
 * @param nftMintAddresses - Mint addresses of NFTs held by this wallet
 * @param skipSoulbound - Skip NFTs #10001+ (honorary soulbound, airdropped)
 */
export const detectWalletMultiplier = async (
  apiKey: string,
  ownerAddress: string,
  nftMintAddresses: readonly string[],
  skipSoulbound = true
): Promise<ApiResult<LoyaltyMultiplier>> => {
  if (nftMintAddresses.length === 0) {
    return ok(1.0 as LoyaltyMultiplier);
  }

  try {
    let bestMultiplier: LoyaltyMultiplier = 1.0;

    // Process in batches of 5 (rate limit friendly)
    const BATCH_SIZE = 5;
    for (let i = 0; i < nftMintAddresses.length; i += BATCH_SIZE) {
      // Early exit: already found the best possible multiplier
      if (bestMultiplier === 1.2) break;

      const batch = nftMintAddresses.slice(i, i + BATCH_SIZE);

      // Fetch mint signatures in parallel
      const sigPromises = batch.map((mint) => fetchMintSignature(apiKey, mint));
      const signatures = await Promise.all(sigPromises);

      // Filter valid signatures
      const validSigs: { mintAddress: string; signature: string }[] = [];
      for (let j = 0; j < batch.length; j++) {
        const sig = signatures[j];
        if (sig) {
          validSigs.push({ mintAddress: batch[j], signature: sig });
        }
      }

      if (validSigs.length === 0) continue;

      // Parse mint transactions in batch
      const txDetails = await parseMintTransactions(
        apiKey,
        validSigs.map((v) => v.signature)
      );

      for (const { signature } of validSigs) {
        const details = txDetails.get(signature);
        if (!details) continue;

        const multiplier = detectNftMultiplier(
          ownerAddress,
          details.feePayer,
          details.timestamp
        );

        if (multiplier > bestMultiplier) {
          bestMultiplier = multiplier;
        }
      }

      // Delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < nftMintAddresses.length && bestMultiplier < 1.2) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return ok(bestMultiplier);
  } catch (error) {
    return err(
      "NETWORK_ERROR",
      error instanceof Error ? error.message : "Failed to detect multiplier",
      true
    );
  }
};
