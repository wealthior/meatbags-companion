"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWalletStore } from "@/stores/wallet-store";
import { useAllNfts } from "./use-nfts";
import type { LoyaltyMultiplier } from "@/types/nft";

interface MultiplierResult {
  success: boolean;
  data?: { multiplier: LoyaltyMultiplier };
  error?: { message: string };
}

/**
 * Fetch the loyalty multiplier for a single wallet via the API proxy.
 */
const fetchWalletMultiplier = async (
  ownerAddress: string,
  mintAddresses: string[]
): Promise<LoyaltyMultiplier> => {
  if (mintAddresses.length === 0) return 1.0;

  const params = new URLSearchParams({
    owner: ownerAddress,
    mints: mintAddresses.slice(0, 50).join(","),
  });

  const response = await fetch(`/api/helius/mint-origins?${params}`);
  const data: MultiplierResult = await response.json();
  if (!data.success) throw new Error(data.error?.message ?? "Failed to detect multiplier");
  return data.data?.multiplier ?? 1.0;
};

/**
 * Hook that auto-detects loyalty multipliers for all tracked wallets.
 * Caches results in the wallet store (persisted to localStorage).
 * Only fetches for wallets that don't already have a cached multiplier.
 */
export const useLoyaltyMultipliers = () => {
  const wallets = useWalletStore((s) => s.wallets);
  const setDetectedMultiplier = useWalletStore((s) => s.setDetectedMultiplier);
  const { data: nftData } = useAllNfts();

  // Find wallets that need detection (no cached multiplier)
  const walletsToDetect = wallets.filter((w) => w.detectedMultiplier === undefined);

  const query = useQuery({
    queryKey: [
      "loyalty-multipliers",
      walletsToDetect.map((w) => w.address),
    ],
    queryFn: async (): Promise<Record<string, LoyaltyMultiplier>> => {
      if (walletsToDetect.length === 0 || !nftData?.byWallet) return {};

      const results: Record<string, LoyaltyMultiplier> = {};

      // Process sequentially to avoid rate limits
      for (const wallet of walletsToDetect) {
        const nfts = nftData.byWallet[wallet.address] ?? [];
        // Filter out soulbound/honorary NFTs (airdropped, not minted)
        const mintAddresses = nfts
          .filter((n) => !n.isSoulbound)
          .map((n) => n.mintAddress);

        try {
          results[wallet.address] = await fetchWalletMultiplier(
            wallet.address,
            mintAddresses
          );
        } catch {
          results[wallet.address] = 1.0;
        }
      }

      return results;
    },
    enabled: walletsToDetect.length > 0 && !!nftData?.byWallet,
    staleTime: Infinity, // Never refetch — mint origin is immutable
    gcTime: Infinity,
  });

  // Persist detected multipliers to wallet store
  useEffect(() => {
    if (query.data) {
      for (const [address, multiplier] of Object.entries(query.data)) {
        setDetectedMultiplier(address, multiplier);
      }
    }
  }, [query.data, setDetectedMultiplier]);

  // Build a map of all multipliers (cached + freshly detected)
  const multipliers: Record<string, LoyaltyMultiplier> = {};
  for (const wallet of wallets) {
    multipliers[wallet.address] = wallet.detectedMultiplier ?? 1.0;
  }

  return {
    multipliers,
    isDetecting: query.isLoading,
  };
};
