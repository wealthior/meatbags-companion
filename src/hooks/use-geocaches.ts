"use client";

import { useQuery } from "@tanstack/react-query";
import type { GeocacheNft, GeocacheData } from "@/types/geocache";
import type { NftTransaction } from "@/types/transaction";
import type { ApiResult } from "@/types/api";
import { useWalletStore } from "@/stores/wallet-store";

/**
 * Fetch geocaches for a single wallet address
 */
const fetchWalletGeocaches = async (address: string): Promise<GeocacheNft[]> => {
  const response = await fetch(`/api/helius/geocaches?owner=${address}`);
  const data: ApiResult<{ items: GeocacheNft[]; total: number }> = await response.json();

  if (!data.success) {
    throw new Error(data.error.message);
  }

  return data.data.items;
};

/**
 * Fetch with retry — retries up to 3 times with increasing delay
 */
const fetchWithRetry = async (
  address: string,
  retries = 3,
  delayMs = 2000,
): Promise<GeocacheNft[]> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchWalletGeocaches(address);
    } catch (error) {
      if (attempt < retries) {
        console.warn(`[geocaches] Retry ${attempt + 1}/${retries} for ${address.slice(0, 8)}...`);
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
      } else {
        console.error(`[geocaches] Failed all ${retries + 1} attempts for ${address.slice(0, 8)}...`, error);
        throw error;
      }
    }
  }
  return []; // unreachable
};

/** Small delay to avoid Helius rate limits */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Deduplicate geocaches across wallets by mint address
 */
const deduplicateGeocaches = (arrays: GeocacheNft[][]): GeocacheNft[] => {
  const seen = new Set<string>();
  const result: GeocacheNft[] = [];
  for (const arr of arrays) {
    for (const gc of arr) {
      if (!seen.has(gc.mintAddress)) {
        seen.add(gc.mintAddress);
        result.push(gc);
      }
    }
  }
  return result;
};

/**
 * Fetch ALL GeoCaches collection mint addresses (including burned).
 * This is the complete set of mints that belong to the GeoCaches collection,
 * used to identify geocache-related transactions even for items no longer held.
 */
const fetchAllCollectionMints = async (): Promise<Set<string>> => {
  const response = await fetch("/api/helius/geocache-mints");
  const data = await response.json();

  if (!data.success) {
    console.error("[geocaches] Failed to fetch collection mints:", data.error);
    return new Set();
  }

  return new Set(data.data.mints as string[]);
};

/**
 * Hook to fetch ALL GeoCaches collection mints (including burned).
 * Cached for 30 minutes since the collection changes infrequently.
 */
export const useGeocacheCollectionMints = () => {
  return useQuery<Set<string>>({
    queryKey: ["geocache-collection-mints"],
    queryFn: fetchAllCollectionMints,
    staleTime: 30 * 60 * 1000, // 30 minutes — collection rarely changes
    retry: 2,
  });
};

/**
 * Hook to fetch GeoCaches for all tracked wallets.
 * Fetches sequentially (one wallet at a time) with delays to avoid rate limiting.
 */
export const useAllGeocaches = () => {
  const wallets = useWalletStore((s) => s.wallets);
  const addresses = wallets.map((w) => w.address);

  return useQuery<GeocacheData>({
    queryKey: ["geocaches", "all", addresses],
    queryFn: async () => {
      if (addresses.length === 0) return { geocaches: [], byWallet: {} };

      const byWallet: Record<string, GeocacheNft[]> = {};
      const allArrays: GeocacheNft[][] = [];
      const failed: string[] = [];

      for (let i = 0; i < addresses.length; i++) {
        const addr = addresses[i];
        try {
          const geocaches = await fetchWithRetry(addr);
          byWallet[addr] = geocaches;
          allArrays.push(geocaches);
          console.log(`[geocaches] Wallet ${i + 1}/${addresses.length} (${addr.slice(0, 8)}...) → ${geocaches.length} GeoCaches`);
        } catch {
          failed.push(addr);
          console.error(`[geocaches] Wallet ${i + 1}/${addresses.length} (${addr.slice(0, 8)}...) → FAILED`);
        }

        if (i < addresses.length - 1) {
          await delay(400);
        }
      }

      if (failed.length > 0) {
        console.warn(`[geocaches] ⚠ ${failed.length} wallet(s) failed.`);
      }

      const geocaches = deduplicateGeocaches(allArrays);
      console.log(`[geocaches] Total: ${geocaches.length} GeoCaches across ${addresses.length} wallets (${failed.length} failed)`);
      return { geocaches, byWallet };
    },
    enabled: addresses.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

/**
 * Fetch geocache-related transaction history for all tracked wallets.
 * Uses the dedicated /api/helius/geocache-transactions endpoint which
 * paginates through ALL wallet transactions and manually identifies
 * Metaplex Core (geocache) operations — Helius classifies these as "UNKNOWN"
 * so standard type-filtered queries miss them entirely.
 */
export const useGeocacheTransactions = () => {
  const wallets = useWalletStore((s) => s.wallets);
  const addresses = wallets.map((w) => w.address);

  return useQuery<NftTransaction[]>({
    queryKey: ["geocache-transactions", "all", addresses],
    queryFn: async (): Promise<NftTransaction[]> => {
      if (addresses.length === 0) return [];

      const allTxns: NftTransaction[] = [];

      // Fetch geocache transactions for each wallet sequentially to avoid rate limits
      for (let i = 0; i < addresses.length; i++) {
        const addr = addresses[i];
        try {
          const response = await fetch(`/api/helius/geocache-transactions?address=${addr}`);
          const data: ApiResult<NftTransaction[]> = await response.json();
          if (data.success) {
            allTxns.push(...data.data);
            console.log(`[geocaches] Wallet ${i + 1}/${addresses.length} (${addr.slice(0, 8)}...) → ${data.data.length} geocache txns`);
          }
        } catch (error) {
          console.error(`[geocaches] Failed to fetch txns for ${addr.slice(0, 8)}...`, error);
        }

        if (i < addresses.length - 1) {
          await delay(400);
        }
      }

      console.log(`[geocaches] Total: ${allTxns.length} geocache transactions across ${addresses.length} wallets`);

      // Sort by timestamp descending
      allTxns.sort((a, b) => b.timestamp - a.timestamp);

      // Deduplicate by signature
      const seen = new Set<string>();
      return allTxns.filter((tx) => {
        if (seen.has(tx.signature)) return false;
        seen.add(tx.signature);
        return true;
      });
    },
    enabled: addresses.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
