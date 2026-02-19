"use client";

import { useQuery } from "@tanstack/react-query";
import type { NftTransaction } from "@/types/transaction";
import type { ApiResult } from "@/types/api";
import { useWalletStore } from "@/stores/wallet-store";

/**
 * Fetch transaction history for a single wallet
 */
const fetchWalletTransactions = async (address: string): Promise<NftTransaction[]> => {
  const response = await fetch(`/api/helius/transactions?address=${address}`);
  const data: ApiResult<NftTransaction[]> = await response.json();
  if (!data.success) throw new Error(data.error.message);
  return data.data;
};

/**
 * Hook to fetch transaction history for all tracked wallets
 */
export const useAllTransactions = () => {
  const wallets = useWalletStore((s) => s.wallets);
  const addresses = wallets.map((w) => w.address);

  return useQuery({
    queryKey: ["transactions", "all", addresses],
    queryFn: async (): Promise<NftTransaction[]> => {
      if (addresses.length === 0) return [];

      const results = await Promise.allSettled(
        addresses.map((addr) => fetchWalletTransactions(addr))
      );

      const allTxns: NftTransaction[] = [];
      for (const result of results) {
        if (result.status === "fulfilled") {
          allTxns.push(...result.value);
        }
      }

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
    staleTime: 5 * 60 * 1000,
  });
};
