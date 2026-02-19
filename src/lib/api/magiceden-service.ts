import type { CollectionStats, NftListing } from "@/types/nft";
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
 * Fetch active MagicEden listings for the MeatBags collection.
 * Paginates through all listings and filters by seller wallets.
 */
export const fetchCollectionListings = async (
  sellerAddresses: string[]
): Promise<ApiResult<NftListing[]>> => {
  if (sellerAddresses.length === 0) return ok([]);

  const sellerSet = new Set(sellerAddresses);
  const allListings: NftListing[] = [];
  let totalScanned = 0;

  console.log(`[magiceden] Fetching collection listings, looking for ${sellerAddresses.length} seller(s)...`);

  try {
    let offset = 0;
    const limit = 100;

    while (true) {
      const url = `${ME_API_BASE}/collections/${MAGICEDEN_SLUG}/listings?offset=${offset}&limit=${limit}`;
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "Accept": "application/json",
          "User-Agent": "MeatBags-Companion/1.0",
        },
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        console.error(`[magiceden] Listings API error: ${response.status} at offset ${offset} — ${body.slice(0, 300)}`);
        // Non-critical: return what we have so far
        if (allListings.length > 0) break;
        return err("MAGICEDEN_API_ERROR", `MagicEden listings error: ${response.status} — ${body.slice(0, 100)}`, true);
      }

      const data: Array<{
        tokenMint: string;
        seller: string;
        price: number;
        rpiConfirmed?: boolean;
      }> = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        console.log(`[magiceden] No more listings at offset ${offset}`);
        break;
      }

      totalScanned += data.length;

      for (const listing of data) {
        if (sellerSet.has(listing.seller)) {
          allListings.push({
            mintAddress: listing.tokenMint,
            seller: listing.seller,
            priceSol: listing.price,
            marketplace: "Magic Eden",
          });
        }
      }

      console.log(`[magiceden] Page offset=${offset}: scanned ${data.length} listings, found ${allListings.length} match(es) so far`);

      if (data.length < limit) break;
      offset += limit;

      // Safety: don't fetch more than 5000 listings
      if (offset >= 5000) {
        console.warn(`[magiceden] Hit pagination limit at offset ${offset}`);
        break;
      }
    }

    console.log(`[magiceden] Done: scanned ${totalScanned} total listings, found ${allListings.length} from user wallets`);
    return ok(allListings);
  } catch (error) {
    console.error(`[magiceden] Failed to fetch listings:`, error);
    return err(
      "MAGICEDEN_API_ERROR",
      error instanceof Error ? error.message : "Failed to fetch listings",
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
