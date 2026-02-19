"use client";

import { useQuery } from "@tanstack/react-query";
import type { MeatbagNft, NftListing } from "@/types/nft";
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
 * Fetch with retry — retries up to 3 times with increasing delay
 */
const fetchWithRetry = async (
  address: string,
  retries = 3,
  delayMs = 2000
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
 * Fetch active MagicEden listings for user's wallets via server route.
 * The ME API blocks direct browser requests (400), so we proxy through our API route.
 */
const fetchListings = async (addresses: string[]): Promise<NftListing[]> => {
  console.log(`[nfts] Fetching ME listings for ${addresses.length} wallet(s) via server...`);

  try {
    const resp = await fetch(
      `/api/magiceden/listings?sellers=${addresses.join(",")}`
    );

    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      console.error(`[nfts] ME listings route returned ${resp.status}: ${body.slice(0, 200)}`);
      return [];
    }

    const data: ApiResult<NftListing[]> = await resp.json();
    if (!data.success) {
      console.error(`[nfts] ME listings error:`, data.error);
      return [];
    }

    console.log(`[nfts] ME listings: found ${data.data.length} listing(s) from your wallets`);
    for (const listing of data.data) {
      console.log(`[nfts]   → ${listing.mintAddress.slice(0, 8)}... by ${listing.seller.slice(0, 8)}... @ ${listing.priceSol} SOL`);
    }

    return data.data;
  } catch (error) {
    console.error("[nfts] Failed to fetch ME listings:", error);
    return [];
  }
};

/**
 * Fetch full NFT metadata for a single mint address (for escrow'd listed NFTs)
 */
const fetchSingleNft = async (mintAddress: string): Promise<MeatbagNft | null> => {
  try {
    console.log(`[nfts] Fetching metadata for escrow'd mint: ${mintAddress.slice(0, 8)}...`);
    const response = await fetch(`/api/helius/assets?mint=${mintAddress}`);

    if (!response.ok) {
      console.error(`[nfts] Mint lookup failed with ${response.status} for ${mintAddress.slice(0, 8)}...`);
      return null;
    }

    const data = await response.json();
    if (!data.success) {
      console.error(`[nfts] Mint lookup error for ${mintAddress.slice(0, 8)}...:`, data.error);
      return null;
    }

    console.log(`[nfts] Recovered escrow'd NFT metadata: ${data.data.name}`);
    return data.data;
  } catch (error) {
    console.error(`[nfts] Failed to fetch mint ${mintAddress.slice(0, 8)}...:`, error);
    return null;
  }
};

/**
 * Hook to fetch NFTs for all tracked wallets.
 * Fetches sequentially (one wallet at a time) with delays to avoid rate limiting.
 * Also fetches ME listings to find escrow'd NFTs and merges listing data.
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

      // Fetch one wallet at a time to avoid any rate limiting
      for (let i = 0; i < addresses.length; i++) {
        const addr = addresses[i];
        try {
          const nfts = await fetchWithRetry(addr);
          byWallet[addr] = nfts;
          allNftArrays.push(nfts);
          console.log(`[nfts] Wallet ${i + 1}/${addresses.length} (${addr.slice(0, 8)}...) → ${nfts.length} MeatBags`);
        } catch {
          failed.push(addr);
          console.error(`[nfts] Wallet ${i + 1}/${addresses.length} (${addr.slice(0, 8)}...) → FAILED`);
        }

        // Delay between each wallet fetch (skip after last)
        if (i < addresses.length - 1) {
          await delay(400);
        }
      }

      if (failed.length > 0) {
        console.warn(`[nfts] ⚠ ${failed.length} wallet(s) failed. NFT count may be incomplete.`);
      }

      let nfts = deduplicateNfts(allNftArrays);
      const knownMints = new Set(nfts.map((n) => n.mintAddress));

      // Fetch ME listings to find escrow'd NFTs + update listing info
      const listings = await fetchListings(addresses);
      console.log(`[nfts] Found ${listings.length} active ME listing(s) from your wallets`);

      if (listings.length > 0) {
        // Update existing NFTs with listing price info
        const listingMap = new Map(listings.map((l) => [l.mintAddress, l]));
        let inWalletListedCount = 0;
        nfts = nfts.map((nft) => {
          const listing = listingMap.get(nft.mintAddress);
          if (listing) {
            inWalletListedCount++;
            return {
              ...nft,
              isListed: true,
              listedMarketplace: listing.marketplace,
              listingPriceSol: listing.priceSol,
            };
          }
          return nft;
        });
        console.log(`[nfts] Updated ${inWalletListedCount} in-wallet NFT(s) with listing info`);

        // Fetch metadata for escrow'd NFTs (listed on ME but not in wallet)
        const escrowedListings = listings.filter((l) => !knownMints.has(l.mintAddress));
        if (escrowedListings.length > 0) {
          console.log(`[nfts] Found ${escrowedListings.length} escrow'd listing(s) — fetching metadata...`);
          for (let i = 0; i < escrowedListings.length; i++) {
            const listing = escrowedListings[i];
            const nft = await fetchSingleNft(listing.mintAddress);
            if (nft) {
              const listedNft: MeatbagNft = {
                ...nft,
                ownerWallet: listing.seller,
                isListed: true,
                listedMarketplace: listing.marketplace,
                listingPriceSol: listing.priceSol,
              };
              nfts.push(listedNft);
              // Add to seller's wallet bucket
              if (!byWallet[listing.seller]) byWallet[listing.seller] = [];
              byWallet[listing.seller].push(listedNft);
              console.log(`[nfts] Recovered escrow'd NFT ${i + 1}/${escrowedListings.length}: ${nft.name} (${listing.marketplace} @ ${listing.priceSol} SOL)`);
            } else {
              console.warn(`[nfts] Failed to recover escrow'd NFT: ${listing.mintAddress.slice(0, 8)}...`);
            }

            // Small delay between individual mint lookups
            if (i < escrowedListings.length - 1) {
              await delay(300);
            }
          }
        } else {
          console.log(`[nfts] All ${listings.length} listed NFTs are already in wallets (delegate-based listing)`);
        }
      }

      console.log(`[nfts] Total: ${nfts.length} MeatBags across ${addresses.length} wallets (${failed.length} failed, ${listings.length} listed)`);
      return { nfts, byWallet };
    },
    enabled: addresses.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
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
