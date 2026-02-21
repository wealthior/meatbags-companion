"use client";

import { useQuery } from "@tanstack/react-query";
import type { NftTransaction } from "@/types/transaction";
import type { ApiResult } from "@/types/api";
import { useWalletStore } from "@/stores/wallet-store";

/**
 * Fetch transaction history for all wallets in a single batched request
 */
const fetchTransactions = async (addresses: string[]): Promise<NftTransaction[]> => {
  const response = await fetch(`/api/helius/transactions?addresses=${addresses.join(",")}`);
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
    queryFn: () => fetchTransactions(addresses),
    enabled: addresses.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};
