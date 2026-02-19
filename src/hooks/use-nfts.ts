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
 * Hook to fetch NFTs for all tracked wallets
 */
export const useAllNfts = () => {
  const wallets = useWalletStore((s) => s.wallets);
  const addresses = wallets.map((w) => w.address);

  return useQuery({
    queryKey: ["nfts", "all", addresses],
    queryFn: async () => {
      if (addresses.length === 0) return { nfts: [], byWallet: {} as Record<string, MeatbagNft[]> };

      const results = await Promise.allSettled(
        addresses.map(async (addr) => ({
          address: addr,
          nfts: await fetchWalletNfts(addr),
        }))
      );

      const byWallet: Record<string, MeatbagNft[]> = {};
      const allNftArrays: MeatbagNft[][] = [];

      for (const result of results) {
        if (result.status === "fulfilled") {
          byWallet[result.value.address] = result.value.nfts;
          allNftArrays.push(result.value.nfts);
        }
      }

      const nfts = deduplicateNfts(allNftArrays);
      return { nfts, byWallet };
    },
    enabled: addresses.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch NFTs for a single wallet
 */
export const useWalletNfts = (address: string | null) =>
  useQuery({
    queryKey: ["nfts", address],
    queryFn: () => (address ? fetchWalletNfts(address) : Promise.resolve([])),
    enabled: !!address,
    staleTime: 10 * 60 * 1000,
  });
