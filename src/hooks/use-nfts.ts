"use client";

import { useQuery } from "@tanstack/react-query";
import type { MeatbagNft } from "@/types/nft";
import type { ApiResult } from "@/types/api";
import { useWalletStore } from "@/stores/wallet-store";
import { deduplicateNfts } from "@/lib/domain/wallet-aggregator";

/**
 * Fetch NFTs for a single wallet address
 */
const fetchWalletNfts = async (address: string): Promise<MeatbagNft[]> => {
  const response = await fetch(`/api/helius/assets?owner=${address}`);
  const data: ApiResult<{ items: MeatbagNft[]; total: number }> = await response.json();

  if (!data.success) {
    throw new Error(data.error.message);
  }

  return data.data.items;
};

/**
 * Fetch with retry — retries once after a delay on failure
 */
const fetchWithRetry = async (
  address: string,
  retries = 2,
  delayMs = 1500
): Promise<MeatbagNft[]> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchWalletNfts(address);
    } catch (error) {
      if (attempt < retries) {
        console.warn(`[nfts] Retry ${attempt + 1}/${retries} for ${address.slice(0, 8)}...`);
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
      } else {
        console.error(`[nfts] Failed all ${retries + 1} attempts for ${address.slice(0, 8)}...`, error);
        throw error;
      }
    }
  }
  return []; // unreachable
};

/** Small delay to avoid Helius rate limits */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Hook to fetch NFTs for all tracked wallets.
 * Fetches in batches of 4 with delays to avoid rate limiting.
 */
export const useAllNfts = () => {
  const wallets = useWalletStore((s) => s.wallets);
  const addresses = wallets.map((w) => w.address);

  return useQuery({
    queryKey: ["nfts", "all", addresses],
    queryFn: async () => {
      if (addresses.length === 0) return { nfts: [], byWallet: {} as Record<string, MeatbagNft[]> };

      const byWallet: Record<string, MeatbagNft[]> = {};
      const allNftArrays: MeatbagNft[][] = [];
      const failed: string[] = [];

      // Fetch in batches of 4 to avoid rate limiting
      const BATCH_SIZE = 4;
      for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
        const batch = addresses.slice(i, i + BATCH_SIZE);

        const results = await Promise.allSettled(
          batch.map(async (addr) => ({
            address: addr,
            nfts: await fetchWithRetry(addr),
          }))
        );

        for (let j = 0; j < results.length; j++) {
          const result = results[j];
          if (result.status === "fulfilled") {
            byWallet[result.value.address] = result.value.nfts;
            allNftArrays.push(result.value.nfts);
          } else {
            failed.push(batch[j]);
            console.error(`[nfts] Wallet ${batch[j].slice(0, 8)}... failed:`, result.reason);
          }
        }

        // Small delay between batches (skip after last batch)
        if (i + BATCH_SIZE < addresses.length) {
          await delay(300);
        }
      }

      if (failed.length > 0) {
        console.warn(`[nfts] ${failed.length} wallet(s) failed to load. NFT count may be incomplete.`);
      }

      const nfts = deduplicateNfts(allNftArrays);
      return { nfts, byWallet };
    },
    enabled: addresses.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};

/**
 * Hook to fetch NFTs for a single wallet
 */
export const useWalletNfts = (address: string | null) =>
  useQuery({
    queryKey: ["nfts", address],
    queryFn: () => (address ? fetchWithRetry(address) : Promise.resolve([])),
    enabled: !!address,
    staleTime: 10 * 60 * 1000,
  });
