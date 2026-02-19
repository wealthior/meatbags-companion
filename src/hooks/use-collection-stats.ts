"use client";

import { useQuery } from "@tanstack/react-query";
import type { CollectionStats } from "@/types/nft";
import type { ApiResult } from "@/types/api";

/**
 * Hook to fetch MeatBags collection stats from MagicEden
 */
export const useCollectionStats = () =>
  useQuery({
    queryKey: ["collection-stats"],
    queryFn: async (): Promise<CollectionStats> => {
      const response = await fetch("/api/magiceden");
      const data: ApiResult<CollectionStats> = await response.json();
      if (!data.success) throw new Error(data.error.message);
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
