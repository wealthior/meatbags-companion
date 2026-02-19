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
 * Parse a Helius DAS asset into our MeatbagNft type
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

    return {
      mintAddress: asset.id,
      name,
      imageUrl,
      maskColor,
      traits,
      ownerWallet: asset.ownership.owner,
      isHonorary: honorary,
      isSoulbound: soulbound,
      dailyYield: getBaseYield(maskColor),
      magicEdenUrl: `${MAGICEDEN_ITEM_URL}/${asset.id}`,
    };
  } catch {
    return null;
  }
};

/**
 * Fetch all MeatBag NFTs owned by a wallet address using Helius DAS API
 */
export const fetchNftsByOwner = async (
  apiKey: string,
  ownerAddress: string,
  page = 1,
  limit = 1000
): Promise<ApiResult<{ items: MeatbagNft[]; total: number; page: number }>> => {
  try {
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
          limit,
          displayOptions: {
            showFungible: false,
            showNativeBalance: false,
            showCollectionMetadata: true,
          },
        },
      }),
    });

    if (!response.ok) {
      reportHeliusFailure();
      return err("HELIUS_UNAVAILABLE", `Helius API error: ${response.status}`, true);
    }

    const data: HeliusDasResponse = await response.json();
    reportHeliusSuccess();

    // Filter to only MeatBags collection
    const meatbagAssets = data.result.items.filter((asset) =>
      asset.grouping?.some(
        (g) => g.group_key === "collection" && g.group_value === COLLECTION_ADDRESS
      )
    );

    const nfts = meatbagAssets
      .map(parseHeliusAsset)
      .filter((nft): nft is MeatbagNft => nft !== null);

    return ok({ items: nfts, total: nfts.length, page });
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
 * Fetch transaction history for a wallet using Helius enhanced transactions API
 */
export const fetchTransactionHistory = async (
  apiKey: string,
  address: string,
  before?: string,
  limit = 50
): Promise<ApiResult<NftTransaction[]>> => {
  try {
    const url = new URL(`https://api.helius.xyz/v0/addresses/${address}/transactions`);
    url.searchParams.set("api-key", apiKey);
    url.searchParams.set("type", "NFT_SALE");
    if (before) url.searchParams.set("before", before);
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url.toString());

    if (!response.ok) {
      reportHeliusFailure();
      return err("HELIUS_UNAVAILABLE", `Helius API error: ${response.status}`, true);
    }

    const data = await response.json();
    reportHeliusSuccess();

    const transactions: NftTransaction[] = (data as unknown[])
      .map(parseHeliusTransaction)
      .filter((tx): tx is NftTransaction => tx !== null);

    return ok(transactions);
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
 * Parse a Helius enhanced transaction into our NftTransaction type
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

    const nftEvent = t.events?.nft;
    if (!nftEvent) return null;

    const type: TransactionType = nftEvent.buyer && nftEvent.seller ? "BUY" : "TRANSFER";
    const solAmount = (nftEvent.amount ?? 0) / 1e9;

    return {
      signature: t.signature,
      type,
      mintAddress: nftEvent.nfts?.[0]?.mint ?? "",
      nftName: "", // Will be enriched later
      solAmount,
      solPriceUsd: 0, // Will be enriched with price data
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
