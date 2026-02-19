import type { MeatbagNft, NftTrait } from "@/types/nft";
import type { NftTransaction, TransactionType } from "@/types/transaction";
import type { ApiResult } from "@/types/api";
import { ok, err } from "@/types/api";
import { COLLECTION_ADDRESS, heliusDasUrl, MAGICEDEN_ITEM_URL } from "@/lib/utils/constants";
import { getMaskColorFromTraits, isHonoraryNft, isSoulboundNft } from "@/lib/domain/traits";
import { getBaseYield } from "@/lib/domain/traits";
import { reportHeliusFailure, reportHeliusSuccess } from "./connection";

interface HeliusDasResponse {
  result: {
    items: HeliusAsset[];
    total: number;
    limit: number;
    page: number;
  };
}

interface HeliusAsset {
  id: string;
  content: {
    metadata: {
      name: string;
      symbol: string;
      description?: string;
      attributes?: Array<{ trait_type: string; value: string }>;
    };
    links?: {
      image?: string;
      external_url?: string;
    };
    files?: Array<{ uri: string; cdn_uri?: string; mime: string }>;
    json_uri?: string;
  };
  authorities?: Array<{ address: string; scopes: string[] }>;
  compression?: {
    compressed: boolean;
  };
  grouping?: Array<{ group_key: string; group_value: string }>;
  ownership: {
    owner: string;
    delegate?: string;
    frozen: boolean;
  };
  royalty?: {
    basis_points: number;
  };
  creators?: Array<{ address: string; share: number; verified: boolean }>;
  burnt?: boolean;
  interface?: string;
  token_info?: unknown;
}

/**
 * Known marketplace program/delegate addresses.
 * When an NFT's freeze delegate matches one of these, it's listed.
 */
const MARKETPLACE_DELEGATES: Record<string, string> = {
  "1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix": "Magic Eden",
  "M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K": "Magic Eden",
  "MEisE1HzehtrDpAAT8PnLHjpSSkRYakotTuJRPjTpo8": "Magic Eden",
  "mmm3XBJg5gk8XJxEKBvdgptZz6SgK4tXvn36sodowMc": "Magic Eden",
  "TSWAPaqyCSx2KABk68Shruf4rp7CxcNi8hAsbdwmHbN": "Tensor",
  "TCMPhJdwDryooaGtiocG1u3xcYbRpiJzb283XfCZsDp": "Tensor",
  "TL1ST2iRBzuGTqLn1KXnGdSnEow62BzPnGiqyRXhWtW": "Tensor",
  "hadeK9DLv9eA7ya5KCTqSvSvRZeJC3JgD5a9Y3CNbvu": "Hadeswap",
};

/**
 * Detect marketplace listing from the delegate address
 */
const detectMarketplace = (delegate?: string): string | null => {
  if (!delegate) return null;
  return MARKETPLACE_DELEGATES[delegate] ?? null;
};

/**
 * Check if a DAS asset belongs to the MeatBags collection.
 * Strict match: only checks collection grouping address.
 */
const isMeatbagAsset = (asset: HeliusAsset): boolean =>
  asset.grouping?.some(
    (g) => g.group_key === "collection" && g.group_value === COLLECTION_ADDRESS
  ) ?? false;

/**
 * Parse a Helius DAS asset into our MeatbagNft type.
 * Detects delegate-based marketplace listings automatically.
 */
const parseHeliusAsset = (asset: HeliusAsset): MeatbagNft | null => {
  try {
    const name = asset.content?.metadata?.name ?? "Unknown MeatBag";
    const imageUrl =
      asset.content?.links?.image ??
      asset.content?.files?.[0]?.uri ??
      "";

    // Extract traits from DAS API metadata attributes
    const traits: NftTrait[] = (asset.content?.metadata?.attributes ?? []).map(
      (attr) => ({
        traitType: attr.trait_type,
        value: attr.value,
      })
    );

    const maskColor = getMaskColorFromTraits(traits);
    const honorary = isHonoraryNft(name, traits);
    const soulbound = isSoulboundNft(name);
    const delegate = asset.ownership.delegate;
    const marketplace = detectMarketplace(delegate);
    // Listed = has marketplace delegate. Staked = frozen WITHOUT marketplace delegate.
    const isListed = marketplace !== null;
    const isStaked = asset.ownership.frozen === true && !isListed;

    return {
      mintAddress: asset.id,
      name,
      imageUrl,
      maskColor,
      traits,
      ownerWallet: asset.ownership.owner,
      isHonorary: honorary,
      isSoulbound: soulbound,
      isStaked,
      stakingProgram: isStaked ? delegate : undefined,
      isListed,
      listedMarketplace: marketplace ?? undefined,
      dailyYield: getBaseYield(maskColor),
      magicEdenUrl: `${MAGICEDEN_ITEM_URL}/${asset.id}`,
    };
  } catch {
    return null;
  }
};

/**
 * Fetch all MeatBag NFTs owned by a wallet address using Helius DAS getAssetsByOwner.
 * Fetches ALL assets for the wallet and filters client-side by collection grouping
 * and name pattern. This is more reliable than searchAssets with grouping filter,
 * which can miss honorary or differently-grouped NFTs.
 */
export const fetchNftsByOwner = async (
  apiKey: string,
  ownerAddress: string,
): Promise<ApiResult<{ items: MeatbagNft[]; total: number }>> => {
  const PAGE_LIMIT = 1000;

  try {
    const allNfts: MeatbagNft[] = [];
    let page = 1;

    while (true) {
      const response = await fetch(heliusDasUrl(apiKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "meatbags-companion",
          method: "getAssetsByOwner",
          params: {
            ownerAddress,
            page,
            limit: PAGE_LIMIT,
            displayOptions: {
              showFungible: false,
              showNativeBalance: false,
              showZeroBalance: false,
            },
          },
        }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        reportHeliusFailure();
        return err("HELIUS_UNAVAILABLE", `Helius API error: ${response.status} — ${body.slice(0, 200)}`, true);
      }

      let data: HeliusDasResponse;
      try {
        const raw = await response.json();
        if (raw.error) {
          reportHeliusFailure();
          return err("HELIUS_UNAVAILABLE", `Helius RPC error: ${raw.error.message ?? JSON.stringify(raw.error)}`, true);
        }
        data = raw;
      } catch (parseError) {
        return err("HELIUS_UNAVAILABLE", `Failed to parse Helius response: ${parseError}`, true);
      }
      reportHeliusSuccess();

      // Client-side filter: only keep MeatBag assets
      const meatbagAssets = data.result.items.filter(isMeatbagAsset);

      let skipped = 0;
      for (const item of meatbagAssets) {
        const parsed = parseHeliusAsset(item);
        if (parsed) {
          allNfts.push(parsed);
        } else {
          skipped++;
          console.warn(`[helius] Failed to parse MeatBag asset: ${item.id} (${item.content?.metadata?.name ?? "unknown"})`);
        }
      }

      if (skipped > 0) {
        console.warn(`[helius] Skipped ${skipped}/${meatbagAssets.length} MeatBag assets for ${ownerAddress} (page ${page})`);
      }

      // Stop when we got fewer items than the limit (last page)
      if (data.result.items.length < PAGE_LIMIT) break;
      page++;
    }

    console.log(`[helius] Found ${allNfts.length} MeatBags for ${ownerAddress.slice(0, 8)}...`);
    return ok({ items: allNfts, total: allNfts.length });
  } catch (error) {
    reportHeliusFailure();
    return err(
      "NETWORK_ERROR",
      error instanceof Error ? error.message : "Failed to fetch NFTs",
      true
    );
  }
};

/**
 * Fetch NFT metadata for a single asset
 */
export const fetchAssetDetails = async (
  apiKey: string,
  mintAddress: string
): Promise<ApiResult<MeatbagNft>> => {
  try {
    const response = await fetch(heliusDasUrl(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "meatbags-companion",
        method: "getAsset",
        params: { id: mintAddress },
      }),
    });

    if (!response.ok) {
      reportHeliusFailure();
      return err("HELIUS_UNAVAILABLE", `Helius API error: ${response.status}`, true);
    }

    const data = await response.json();
    reportHeliusSuccess();

    const nft = parseHeliusAsset(data.result);
    if (!nft) {
      return err("COLLECTION_NOT_FOUND", "Failed to parse NFT data", false);
    }

    return ok(nft);
  } catch (error) {
    reportHeliusFailure();
    return err(
      "NETWORK_ERROR",
      error instanceof Error ? error.message : "Failed to fetch asset",
      true
    );
  }
};

/**
 * Fetch transaction history for a wallet using Helius enhanced transactions API.
 * Fetches multiple transaction types in parallel (NFT_SALE + NFT_TRANSFER by default).
 */
export const fetchTransactionHistory = async (
  apiKey: string,
  address: string,
  options?: {
    before?: string;
    limit?: number;
    types?: string[];
  }
): Promise<ApiResult<NftTransaction[]>> => {
  const { before, limit = 100, types = ["NFT_SALE", "NFT_TRANSFER"] } = options ?? {};

  try {
    const results = await Promise.allSettled(
      types.map(async (txType) => {
        const url = new URL(`https://api.helius.xyz/v0/addresses/${address}/transactions`);
        url.searchParams.set("api-key", apiKey);
        url.searchParams.set("type", txType);
        if (before) url.searchParams.set("before", before);
        url.searchParams.set("limit", String(limit));

        const response = await fetch(url.toString());
        if (!response.ok) {
          reportHeliusFailure();
          throw new Error(`Helius API error: ${response.status}`);
        }
        reportHeliusSuccess();
        return (await response.json()) as unknown[];
      })
    );

    const allRaw: unknown[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        allRaw.push(...result.value);
      }
    }

    const transactions = allRaw
      .map(parseHeliusTransaction)
      .filter((tx): tx is NftTransaction => tx !== null);

    // Deduplicate by signature
    const seen = new Set<string>();
    const unique = transactions.filter((tx) => {
      if (seen.has(tx.signature)) return false;
      seen.add(tx.signature);
      return true;
    });

    unique.sort((a, b) => b.timestamp - a.timestamp);
    return ok(unique);
  } catch (error) {
    reportHeliusFailure();
    return err(
      "NETWORK_ERROR",
      error instanceof Error ? error.message : "Failed to fetch transactions",
      true
    );
  }
};

/**
 * Parse a Helius enhanced transaction into our NftTransaction type.
 * Handles both NFT_SALE (via events.nft) and NFT_TRANSFER (via tokenTransfers).
 */
const parseHeliusTransaction = (tx: unknown): NftTransaction | null => {
  try {
    const t = tx as {
      signature: string;
      type: string;
      timestamp: number;
      nativeTransfers?: Array<{ fromUserAccount: string; toUserAccount: string; amount: number }>;
      tokenTransfers?: Array<{ fromUserAccount: string; toUserAccount: string; mint: string }>;
      events?: {
        nft?: {
          buyer?: string;
          seller?: string;
          amount?: number;
          nfts?: Array<{ mint: string; tokenStandard: string }>;
          source?: string;
          description?: string;
        };
      };
    };

    // Handle NFT_TRANSFER — no nft event, use tokenTransfers
    if (t.type === "NFT_TRANSFER" || t.type === "TRANSFER") {
      const tokenTransfer = t.tokenTransfers?.[0];
      if (!tokenTransfer) return null;

      return {
        signature: t.signature,
        type: "TRANSFER",
        mintAddress: tokenTransfer.mint ?? "",
        nftName: "",
        solAmount: 0,
        solPriceUsd: 0,
        usdAmount: 0,
        timestamp: t.timestamp,
        fromWallet: tokenTransfer.fromUserAccount ?? "",
        toWallet: tokenTransfer.toUserAccount ?? "",
        marketplace: "Transfer",
      };
    }

    // Handle NFT_SALE — use events.nft
    const nftEvent = t.events?.nft;
    if (!nftEvent) return null;

    const type: TransactionType =
      nftEvent.buyer && nftEvent.seller && (nftEvent.amount ?? 0) > 0
        ? "BUY"
        : "TRANSFER";
    const solAmount = (nftEvent.amount ?? 0) / 1e9;

    return {
      signature: t.signature,
      type,
      mintAddress: nftEvent.nfts?.[0]?.mint ?? "",
      nftName: "",
      solAmount,
      solPriceUsd: 0,
      usdAmount: 0,
      timestamp: t.timestamp,
      fromWallet: nftEvent.seller ?? "",
      toWallet: nftEvent.buyer ?? "",
      marketplace: nftEvent.source ?? "Unknown",
    };
  } catch {
    return null;
  }
};
