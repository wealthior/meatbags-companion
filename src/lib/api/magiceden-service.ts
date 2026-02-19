import type { CollectionStats } from "@/types/nft";
import type { ApiResult } from "@/types/api";
import { ok, err } from "@/types/api";
import { MAGICEDEN_SLUG, MAGICEDEN_ITEM_URL, MAGICEDEN_COLLECTION_URL } from "@/lib/utils/constants";

const ME_API_BASE = "https://api-mainnet.magiceden.dev/v2";

/**
 * Fetch MeatBags collection stats from MagicEden
 */
export const fetchCollectionStats = async (): Promise<ApiResult<CollectionStats>> => {
  try {
    const response = await fetch(
      `${ME_API_BASE}/collections/${MAGICEDEN_SLUG}/stats`,
      { next: { revalidate: 300 } }
    );

    if (!response.ok) {
      return err("MAGICEDEN_API_ERROR", `MagicEden error: ${response.status}`, true);
    }

    const data = await response.json();

    return ok({
      totalItems: data.totalItems ?? 10_034,
      uniqueHolders: data.uniqueHolders ?? 0,
      floorPrice: (data.floorPrice ?? 0) / 1e9,
      listedCount: data.listedCount ?? 0,
      volume24h: (data.volume24hr ?? 0) / 1e9,
      volume7d: (data.volume7d ?? 0) / 1e9,
      volume30d: (data.volume30d ?? 0) / 1e9,
      volumeAll: (data.volumeAll ?? 0) / 1e9,
    });
  } catch (error) {
    return err(
      "MAGICEDEN_API_ERROR",
      error instanceof Error ? error.message : "Failed to fetch collection stats",
      true
    );
  }
};

/**
 * Build a MagicEden item URL for a specific NFT
 */
export const buildNftUrl = (mintAddress: string): string =>
  `${MAGICEDEN_ITEM_URL}/${mintAddress}`;

/**
 * Build the MagicEden collection URL
 */
export const buildCollectionUrl = (): string => MAGICEDEN_COLLECTION_URL;
