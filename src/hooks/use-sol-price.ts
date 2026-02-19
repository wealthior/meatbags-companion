"use client";

import { useQuery } from "@tanstack/react-query";
import type { SolPrice, PriceHistory, PriceRange } from "@/types/price";
import type { ApiResult } from "@/types/api";

/**
 * Hook to fetch current SOL price
 */
export const useSolPrice = () =>
  useQuery({
    queryKey: ["sol-price"],
    queryFn: async (): Promise<SolPrice> => {
      const response = await fetch("/api/price");
      const data: ApiResult<SolPrice> = await response.json();
      if (!data.success) throw new Error(data.error.message);
      return data.data;
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000,
  });

/**
 * Hook to fetch historical SOL prices
 */
export const useSolPriceHistory = (range: PriceRange) =>
  useQuery({
    queryKey: ["sol-price-history", range],
    queryFn: async (): Promise<PriceHistory> => {
      const response = await fetch(`/api/price?range=${range}`);
      const data: ApiResult<PriceHistory> = await response.json();
      if (!data.success) throw new Error(data.error.message);
      return data.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
