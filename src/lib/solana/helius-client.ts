import type { MeatbagNft, NftTrait } from "@/types/nft";
import type { GeocacheNft, GeocacheTier, GeocacheSeries } from "@/types/geocache";
import type { NftTransaction, TransactionType } from "@/types/transaction";
import type { ApiResult } from "@/types/api";
import { ok, err } from "@/types/api";
import {
  COLLECTION_ADDRESS,
  GEOCACHE_COLLECTION_ADDRESS,
  GEOCACHE_AUTHORITY_NEW,
  GEOCACHE_HALLOWEEN_START,
  GEOCACHE_HALLOWEEN_END,
  GEOCACHE_MERRY_CRISIS_START,
  GEOCACHE_MERRY_CRISIS_END,
  heliusDasUrl,
  MAGICEDEN_ITEM_URL,
} from "@/lib/utils/constants";
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
  const {
    before,
    limit = 100,
    types = ["NFT_SALE", "NFT_TRANSFER", "NFT_LISTING", "NFT_CANCEL_LISTING", "NFT_BID", "NFT_MINT", "BURN_NFT"],
  } = options ?? {};

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

/** Metaplex Core program ID — used by GeoCaches (MplCoreAsset) */
const METAPLEX_CORE_PROGRAM = "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";

/** Known marketplace program IDs for buy/sell detection */
const MARKETPLACE_PROGRAMS = new Set([
  "M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K",  // Magic Eden v2
  "mmm3XBJg5gk8XJxEKBvdgptZz6SgK4tXvn36sodowMc",  // Magic Eden MMM
  "MEisE1HzehtrDpAAT8PnLHjpSSkRYakotTuJRPjTpo8",   // Magic Eden v3
  "TSWAPaqyCSx2KABk68Shruf4rp7CxcNi8hAsbdwmHbN",   // Tensor
  "TCMPhJdwDryooaGtiocG1u3xcYbRpiJzb283XfCZsDp",    // Tensor cNFT
  "TL1ST2iRBzuGTqLn1KXnGdSnEow62BzPnGiqyRXhWtW",   // Tensor listing
  "hadeK9DLv9eA7ya5KCTqSvSvRZeJC3JgD5a9Y3CNbvu",   // Hadeswap
]);

/**
 * Fetch geocache-specific transactions for a wallet.
 *
 * GeoCaches are Metaplex Core assets. The Helius Enhanced Transactions API
 * does NOT recognize Core asset operations — it classifies them as "UNKNOWN".
 * So we fetch ALL transactions (no type filter), paginate, and manually detect
 * geocache-related ones by checking if the collection address appears in
 * instruction accounts. Then we classify as BUY/SELL/BURN/TRANSFER.
 *
 * Uses smart stopping: stops after `emptyPageThreshold` consecutive pages
 * with 0 geocache transactions (default: 5). Hard limit at `maxPages` (default: 50).
 */
export const fetchGeocacheTransactions = async (
  apiKey: string,
  address: string,
  maxPages = 50,
  emptyPageThreshold = 5,
): Promise<ApiResult<NftTransaction[]>> => {
  const PAGE_LIMIT = 100;

  try {
    const allTxns: NftTransaction[] = [];
    let before: string | undefined;
    let consecutiveEmptyPages = 0;

    for (let page = 0; page < maxPages; page++) {
      const url = new URL(`https://api.helius.xyz/v0/addresses/${address}/transactions`);
      url.searchParams.set("api-key", apiKey);
      url.searchParams.set("limit", String(PAGE_LIMIT));
      if (before) url.searchParams.set("before", before);

      const response = await fetch(url.toString());
      if (!response.ok) {
        reportHeliusFailure();
        return err("HELIUS_UNAVAILABLE", `Helius API error: ${response.status}`, true);
      }
      reportHeliusSuccess();

      const rawTxns = (await response.json()) as RawHeliusTx[];
      if (rawTxns.length === 0) break;

      // Filter to geocache-related transactions
      let pageGcCount = 0;
      for (const raw of rawTxns) {
        if (!isGeocacheTx(raw, GEOCACHE_COLLECTION_ADDRESS)) continue;
        const parsed = parseGeocacheTx(raw, address);
        if (parsed) {
          allTxns.push(parsed);
          pageGcCount++;
        }
      }

      // Smart stopping: if no geocache txs found on this page, increment counter.
      // Stop after `emptyPageThreshold` consecutive empty pages to avoid
      // scanning the entire wallet history when older txs are all non-geocache.
      if (pageGcCount === 0) {
        consecutiveEmptyPages++;
        if (consecutiveEmptyPages >= emptyPageThreshold) break;
      } else {
        consecutiveEmptyPages = 0;
      }

      // Pagination: use last signature as cursor
      before = rawTxns[rawTxns.length - 1]?.signature;
      if (rawTxns.length < PAGE_LIMIT) break; // last page
    }

    // Deduplicate + sort
    const seen = new Set<string>();
    const unique = allTxns.filter((tx) => {
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
      error instanceof Error ? error.message : "Failed to fetch geocache transactions",
      true,
    );
  }
};

/** Raw Helius enhanced transaction shape (minimal, for geocache parsing) */
interface RawHeliusTx {
  signature: string;
  type: string;
  source: string;
  timestamp: number;
  fee: number;
  feePayer: string;
  nativeTransfers?: Array<{ fromUserAccount: string; toUserAccount: string; amount: number }>;
  tokenTransfers?: Array<{ fromUserAccount: string; toUserAccount: string; mint: string }>;
  accountData?: Array<{ account: string; nativeBalanceChange: number }>;
  instructions?: Array<{ programId: string; accounts?: string[] }>;
  events?: {
    nft?: {
      buyer?: string;
      seller?: string;
      amount?: number;
      nfts?: Array<{ mint: string }>;
      source?: string;
    };
  };
}

/**
 * Check if a raw Helius tx is geocache-related.
 * A tx is geocache-related if the collection address appears in any instruction's accounts.
 */
const isGeocacheTx = (tx: RawHeliusTx, collectionAddress: string): boolean =>
  tx.instructions?.some((inst) => inst.accounts?.includes(collectionAddress)) ?? false;

/**
 * Parse a raw geocache-related Helius tx into our NftTransaction type.
 * Determines type from program + SOL flow:
 * - Marketplace program/source + significant SOL flow = BUY or SELL
 * - Core program + wallet is feePayer + tiny SOL change = BURN (wallet opened it)
 * - Core program + different feePayer = TRANSFER (mint/claim from raid)
 */
const parseGeocacheTx = (tx: RawHeliusTx, walletAddress: string): NftTransaction | null => {
  try {
    const hasMarketplace =
      MARKETPLACE_PROGRAMS.has(tx.source) ||
      tx.instructions?.some((inst) => MARKETPLACE_PROGRAMS.has(inst.programId)) === true;

    // Calculate total SOL the wallet spent or received
    const walletSolChange = tx.accountData?.find((a) => a.account === walletAddress)?.nativeBalanceChange ?? 0;
    const absSolChange = Math.abs(walletSolChange) / 1e9;

    // Determine the geocache mint from instruction accounts
    // For Core assets, the mint is usually the first account in the Core program instruction
    const coreInst = tx.instructions?.find((inst) => inst.programId === METAPLEX_CORE_PROGRAM);
    const mintAddress = coreInst?.accounts?.[0] ?? "";

    // Classify transaction type
    let type: TransactionType;
    let fromWallet = "";
    let toWallet = "";
    let solAmount = 0;

    if (hasMarketplace && absSolChange > 0.01) {
      // Marketplace trade — determine buy vs sell from SOL flow
      // Threshold at 0.01 SOL to exclude listing/delisting rent refunds (~0.0035 SOL)
      // which are NOT real trades but get misclassified because marketplace programs are involved.
      if (walletSolChange < 0) {
        // Wallet lost SOL → bought
        type = "BUY";
        fromWallet = "marketplace";
        toWallet = walletAddress;
        solAmount = absSolChange;
      } else {
        // Wallet gained SOL → sold
        type = "SELL";
        fromWallet = walletAddress;
        toWallet = "marketplace";
        solAmount = absSolChange;
      }
    } else if (hasMarketplace && absSolChange <= 0.01) {
      // Marketplace tx with tiny SOL change (rent refund from listing/delisting).
      // Classify as LIST or DELIST — NOT as a trade.
      type = walletSolChange > 0 ? "DELIST" : "LIST";
      fromWallet = walletAddress;
      toWallet = "";
      solAmount = 0;
    } else if (coreInst && absSolChange < 0.005) {
      // Core program tx with no significant SOL change.
      // If the wallet is the fee payer, it initiated the action → BURN (opening geocache).
      // If someone else pays the fee, it's a mint/claim → TRANSFER.
      if (tx.feePayer === walletAddress) {
        type = "BURN";
        fromWallet = walletAddress;
        toWallet = "";
      } else {
        type = "TRANSFER";
        fromWallet = tx.feePayer;
        toWallet = walletAddress;
      }
    } else {
      type = "TRANSFER";
      fromWallet = tx.feePayer;
      toWallet = walletAddress;
    }

    return {
      signature: tx.signature,
      type,
      mintAddress,
      nftName: "",
      solAmount,
      solPriceUsd: 0,
      usdAmount: 0,
      timestamp: tx.timestamp,
      fromWallet,
      toWallet,
      marketplace: hasMarketplace ? (tx.source || "Marketplace") : "Core",
    };
  } catch {
    return null;
  }
};

/**
 * Map Helius transaction type strings to our TransactionType.
 */
const HELIUS_TYPE_MAP: Record<string, TransactionType> = {
  NFT_LISTING: "LIST",
  NFT_CANCEL_LISTING: "DELIST",
  NFT_BID: "BID",
  NFT_GLOBAL_BID: "BID",
  NFT_MINT: "MINT",
  BURN_NFT: "BURN",
};

/**
 * Parse a Helius enhanced transaction into our NftTransaction type.
 * Handles NFT_SALE, NFT_TRANSFER, NFT_LISTING, NFT_CANCEL_LISTING,
 * NFT_BID, NFT_MINT, and BURN_NFT.
 */
const parseHeliusTransaction = (tx: unknown): NftTransaction | null => {
  try {
    const t = tx as {
      signature: string;
      type: string;
      description?: string;
      source?: string;
      fee?: number;
      feePayer?: string;
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

    const description = t.description ?? t.events?.nft?.description;
    const fee = t.fee ? t.fee / 1e9 : undefined;
    const topSource = t.source ?? t.events?.nft?.source ?? "Unknown";

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
        description,
        fee,
      };
    }

    // Handle listing, delist, bid, mint, burn — use mapped type
    const mappedType = HELIUS_TYPE_MAP[t.type];
    if (mappedType) {
      const nftEvent = t.events?.nft;
      const mint = nftEvent?.nfts?.[0]?.mint ?? t.tokenTransfers?.[0]?.mint ?? "";
      const solAmount = nftEvent?.amount ? nftEvent.amount / 1e9 : 0;

      return {
        signature: t.signature,
        type: mappedType,
        mintAddress: mint,
        nftName: "",
        solAmount,
        solPriceUsd: 0,
        usdAmount: 0,
        timestamp: t.timestamp,
        fromWallet: nftEvent?.seller ?? t.feePayer ?? "",
        toWallet: nftEvent?.buyer ?? "",
        marketplace: topSource,
        description,
        fee,
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
      marketplace: nftEvent.source ?? topSource,
      description,
      fee,
    };
  } catch {
    return null;
  }
};

// ─── GeoCaches ────────────────────────────────────────────────────────────────

/** Valid geocache tier values */
const VALID_GEOCACHE_TIERS = new Set<string>(["Common", "Rare"]);

/** Valid geocache series values */
const VALID_GEOCACHE_SERIES = new Set<string>(["Bounty Box I", "Bounty Box II", "Shit Box", "Halloween", "Merry Crisis"]);

/**
 * Check if a DAS asset belongs to the GeoCaches collection
 */
const isGeocacheAsset = (asset: HeliusAsset): boolean =>
  asset.grouping?.some(
    (g) => g.group_key === "collection" && g.group_value === GEOCACHE_COLLECTION_ADDRESS
  ) ?? false;

/**
 * Parse a Helius DAS asset into our GeocacheNft type
 */
const parseGeocacheAsset = (asset: HeliusAsset): GeocacheNft | null => {
  try {
    const name = asset.content?.metadata?.name ?? "Unknown GeoCaches";
    const imageUrl =
      asset.content?.links?.image ??
      asset.content?.files?.[0]?.uri ??
      "";

    const traits: NftTrait[] = (asset.content?.metadata?.attributes ?? []).map(
      (attr) => ({
        traitType: attr.trait_type,
        value: attr.value,
      })
    );

    // Extract tier and series from traits
    const tierTrait = traits.find((t) => t.traitType === "Tier")?.value ?? "Common";
    const seriesTrait = traits.find((t) => t.traitType === "Series")?.value ?? "Bounty Box I";

    const tier: GeocacheTier = VALID_GEOCACHE_TIERS.has(tierTrait)
      ? (tierTrait as GeocacheTier)
      : "Common";
    const series: GeocacheSeries = VALID_GEOCACHE_SERIES.has(seriesTrait)
      ? (seriesTrait as GeocacheSeries)
      : "Bounty Box I";

    const delegate = asset.ownership.delegate;
    const marketplace = detectMarketplace(delegate);
    const isListed = marketplace !== null;

    return {
      mintAddress: asset.id,
      name,
      imageUrl,
      ownerWallet: asset.ownership.owner,
      tier,
      series,
      traits,
      isBurned: asset.burnt === true,
      isListed,
      listedMarketplace: marketplace ?? undefined,
      magicEdenUrl: `${MAGICEDEN_ITEM_URL}/${asset.id}`,
      _authority: asset.authorities?.[0]?.address,
    };
  } catch {
    return null;
  }
};

/** Solana RPC getSignaturesForAddress response item */
interface SolanaSignature {
  signature: string;
  slot: number;
  err: unknown;
  memo: string | null;
  blockTime: number | null;
  confirmationStatus: string;
}

/** Metaplex Core program address */
const CORE_PROGRAM_ID = "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";

/**
 * Determine the original series of a burned geocache whose metadata was changed.
 *
 * Detection strategy (two-step):
 * 1. **October 2025**: Date alone → Halloween. Only Halloween was minted under the
 *    new authority in October, so date-based detection is 100% reliable.
 * 2. **December 2025 – February 2026**: Date alone is NOT sufficient because BB2 geocaches
 *    were also minted in this period. Instead, we check for an UpdateV1 instruction (`L`)
 *    in the TX history. If found, the metadata was changed (MC → BB2) before burn → Merry Crisis.
 *    If not found, it's a genuine BB2.
 * 3. **Other periods**: Return null → trust the DAS metadata.
 */
const inferOriginalSeries = (
  creationTimestamp: number,
  hasMetadataChange: boolean,
): GeocacheSeries | null => {
  // October 2025 = Halloween (date alone is reliable — only Halloween minted under new authority)
  if (creationTimestamp >= GEOCACHE_HALLOWEEN_START && creationTimestamp < GEOCACHE_HALLOWEEN_END) {
    return "Halloween";
  }
  // December 2025 – February 2026 = Merry Crisis ONLY if metadata was changed (UpdateV1 found)
  // Without UpdateV1 confirmation, it's a genuine BB2 — don't reclassify
  if (
    creationTimestamp >= GEOCACHE_MERRY_CRISIS_START &&
    creationTimestamp < GEOCACHE_MERRY_CRISIS_END &&
    hasMetadataChange
  ) {
    return "Merry Crisis";
  }
  return null; // Not a special series — trust the DAS metadata
};

/**
 * Make a JSON-RPC call to the Helius/Solana RPC endpoint.
 */
const rpcCall = async (apiKey: string, method: string, params: unknown[]): Promise<unknown> => {
  const response = await fetch(heliusDasUrl(apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "meatbags-companion-gc-resolve",
      method,
      params,
    }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.result ?? null;
};

/**
 * Check if a burned geocache had its metadata changed via UpdateV1.
 * When the game "opens" a Halloween or Merry Crisis geocache, it sends an UpdateV1
 * instruction (discriminator "L") on the Core program to change the series to BB1/BB2.
 *
 * We check all signatures between the first (create) and last (burn) for this instruction.
 * Returns true if any middle TX contains the UpdateV1 instruction.
 */
const detectMetadataChange = async (
  apiKey: string,
  mintAddress: string,
  signatures: readonly SolanaSignature[],
): Promise<boolean> => {
  // Need at least 3 sigs for a middle TX to exist (create + updateV1 + burn)
  if (signatures.length < 3) return false;

  // Check each signature between oldest (create) and newest (burn) for UpdateV1
  for (let i = 1; i < signatures.length - 1; i++) {
    try {
      const tx = await rpcCall(apiKey, "getTransaction", [
        signatures[i].signature,
        { encoding: "json", maxSupportedTransactionVersion: 0 },
      ]) as { transaction?: { message?: { accountKeys?: string[]; instructions?: Array<{ programIdIndex?: number; data?: string }> } }; meta?: { innerInstructions?: Array<{ instructions: Array<{ programIdIndex?: number; data?: string }> }> } } | null;

      if (!tx?.transaction?.message) continue;

      const keys = tx.transaction.message.accountKeys ?? [];
      const instructions = tx.transaction.message.instructions ?? [];

      // Check main instructions
      for (const ix of instructions) {
        if (
          ix.programIdIndex !== undefined &&
          keys[ix.programIdIndex] === CORE_PROGRAM_ID &&
          ix.data === "L"
        ) {
          return true;
        }
      }

      // Check inner instructions
      if (tx.meta?.innerInstructions) {
        for (const inner of tx.meta.innerInstructions) {
          for (const ix of inner.instructions) {
            if (
              ix.programIdIndex !== undefined &&
              keys[ix.programIdIndex] === CORE_PROGRAM_ID &&
              ix.data === "L"
            ) {
              return true;
            }
          }
        }
      }
    } catch {
      continue;
    }
  }

  return false;
};

/**
 * Resolve the original series for burned geocaches whose metadata was changed.
 *
 * Two-phase detection:
 * 1. Get signatures to determine creation timestamp
 * 2. For Halloween period (Oct 2025): date alone is sufficient
 * 3. For MC/BB2 overlap period (Dec 2025–Feb 2026): additionally check for UpdateV1
 *    instruction in the TX history to confirm metadata was actually changed
 *
 * Returns a Map of mintAddress → corrected GeocacheSeries.
 * Only includes entries where the original series differs from current DAS metadata.
 */
const resolveOriginalSeries = async (
  apiKey: string,
  burnedGeocaches: readonly GeocacheNft[],
): Promise<Map<string, GeocacheSeries>> => {
  const corrections = new Map<string, GeocacheSeries>();

  for (const gc of burnedGeocaches) {
    try {
      // Step 1: Get all signatures to determine creation timestamp
      const sigResult = await rpcCall(apiKey, "getSignaturesForAddress", [
        gc.mintAddress,
        { limit: 100 },
      ]) as SolanaSignature[] | null;

      const sigs = sigResult ?? [];
      if (sigs.length === 0) continue;

      // The oldest signature (last in array) is the creation TX
      const oldest = sigs[sigs.length - 1];
      if (!oldest.blockTime) continue;

      // Step 2: Determine if metadata was changed (only needed for MC overlap period)
      const inMerryCrisisWindow =
        oldest.blockTime >= GEOCACHE_MERRY_CRISIS_START &&
        oldest.blockTime < GEOCACHE_MERRY_CRISIS_END;

      let hasMetadataChange = false;
      if (inMerryCrisisWindow) {
        // MC/BB2 overlap — need UpdateV1 confirmation
        hasMetadataChange = await detectMetadataChange(apiKey, gc.mintAddress, sigs);
      }

      // Step 3: Infer original series
      const originalSeries = inferOriginalSeries(oldest.blockTime, hasMetadataChange);
      if (originalSeries && originalSeries !== gc.series) {
        corrections.set(gc.mintAddress, originalSeries);
      }
    } catch {
      // Best-effort — skip assets that fail
      continue;
    }
  }

  return corrections;
};

/**
 * Fetch all GeoCaches NFTs owned by a wallet address using Helius DAS getAssetsByOwner.
 * Same pagination strategy as fetchNftsByOwner but filters by GeoCaches collection.
 */
export const fetchGeocachesByOwner = async (
  apiKey: string,
  ownerAddress: string,
): Promise<ApiResult<{ items: GeocacheNft[]; total: number }>> => {
  const PAGE_LIMIT = 1000;

  try {
    const allGeocaches: GeocacheNft[] = [];

    // --- Phase 1: Fetch HELD geocaches via getAssetsByOwner ---
    let page = 1;
    while (true) {
      const response = await fetch(heliusDasUrl(apiKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "meatbags-companion-geocaches",
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

      // Client-side filter: only keep GeoCaches assets
      const geocacheAssets = data.result.items.filter(isGeocacheAsset);

      let skipped = 0;
      for (const item of geocacheAssets) {
        const parsed = parseGeocacheAsset(item);
        if (parsed) {
          allGeocaches.push(parsed);
        } else {
          skipped++;
          console.warn(`[helius] Failed to parse GeoCaches asset: ${item.id} (${item.content?.metadata?.name ?? "unknown"})`);
        }
      }

      if (skipped > 0) {
        console.warn(`[helius] Skipped ${skipped}/${geocacheAssets.length} GeoCaches assets for ${ownerAddress} (page ${page})`);
      }

      if (data.result.items.length < PAGE_LIMIT) break;
      page++;
    }

    const heldCount = allGeocaches.length;

    // --- Phase 2: Fetch BURNED geocaches via searchAssets (burnt: true) ---
    // getAssetsByOwner only returns currently-held assets. To get burned/opened
    // geocaches that belonged to this wallet, we use searchAssets with burnt flag.
    // The DAS API tracks the last owner before burn.
    const seenMints = new Set(allGeocaches.map((gc) => gc.mintAddress));
    let burnPage = 1;

    while (true) {
      const burnResponse = await fetch(heliusDasUrl(apiKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "meatbags-companion-geocaches-burned",
          method: "searchAssets",
          params: {
            ownerAddress,
            grouping: ["collection", GEOCACHE_COLLECTION_ADDRESS],
            burnt: true,
            page: burnPage,
            limit: PAGE_LIMIT,
          },
        }),
      });

      if (!burnResponse.ok) {
        // Burned fetch is best-effort — log warning but don't fail
        console.warn(`[helius] Failed to fetch burned GeoCaches (page ${burnPage}): ${burnResponse.status}`);
        break;
      }

      let burnData: HeliusDasResponse;
      try {
        const raw = await burnResponse.json();
        if (raw.error) {
          console.warn(`[helius] Burned GeoCaches RPC error: ${raw.error?.message ?? JSON.stringify(raw.error)}`);
          break;
        }
        burnData = raw;
      } catch {
        console.warn(`[helius] Failed to parse burned GeoCaches response (page ${burnPage})`);
        break;
      }
      reportHeliusSuccess();

      const burnedItems = burnData.result.items;
      let burnSkipped = 0;

      for (const item of burnedItems) {
        // Skip duplicates (shouldn't happen, but be safe)
        if (seenMints.has(item.id)) continue;
        seenMints.add(item.id);

        const parsed = parseGeocacheAsset(item);
        if (parsed) {
          allGeocaches.push(parsed);
        } else {
          burnSkipped++;
        }
      }

      if (burnSkipped > 0) {
        console.warn(`[helius] Skipped ${burnSkipped}/${burnedItems.length} burned GeoCaches for ${ownerAddress} (page ${burnPage})`);
      }

      if (burnedItems.length < PAGE_LIMIT) break;
      burnPage++;
    }

    const burnedCount = allGeocaches.length - heldCount;

    // --- Phase 3: Resolve original series for burned geocaches with new authority ---
    // When a geocache is "opened" in-game, the metadata is updated from its original
    // series (Halloween, Merry Crisis) to a generic one (BB1/BB2) via UpdateV1 before burn.
    // The DAS API shows only the post-update metadata. To detect the ORIGINAL series:
    // - Halloween (Oct 2025): creation timestamp alone is sufficient
    // - Merry Crisis (Dec 2025–Feb 2026): requires UpdateV1 instruction detection
    //   because BB2 was also minted in the same period
    const burnedNewAuth = allGeocaches.filter(
      (gc) => gc.isBurned && gc._authority === GEOCACHE_AUTHORITY_NEW,
    );

    if (burnedNewAuth.length > 0) {
      const resolved = await resolveOriginalSeries(apiKey, burnedNewAuth);
      let correctedCount = 0;
      for (const [mintAddress, originalSeries] of resolved) {
        const gc = allGeocaches.find((g) => g.mintAddress === mintAddress);
        if (gc && gc.series !== originalSeries) {
          (gc as { series: GeocacheSeries }).series = originalSeries;
          correctedCount++;
        }
      }
      if (correctedCount > 0) {
        console.log(`[helius] Corrected original series for ${correctedCount}/${burnedNewAuth.length} burned GeoCaches`);
      }
    }

    console.log(`[helius] Found ${allGeocaches.length} GeoCaches for ${ownerAddress.slice(0, 8)}... (${heldCount} held, ${burnedCount} burned/opened)`);
    return ok({ items: allGeocaches, total: allGeocaches.length });
  } catch (error) {
    reportHeliusFailure();
    return err(
      "NETWORK_ERROR",
      error instanceof Error ? error.message : "Failed to fetch GeoCaches",
      true
    );
  }
};

/**
 * Fetch ALL GeoCaches mint addresses that belong to the collection using searchAssets.
 * This returns ALL mints (including burned ones), so we can correctly identify
 * geocache-related transactions even when the wallet no longer holds them.
 * Uses DAS searchAssets with collection grouping filter + burnt option.
 */
export const fetchAllGeocacheMints = async (
  apiKey: string,
): Promise<ApiResult<Set<string>>> => {
  const PAGE_LIMIT = 1000;

  try {
    const allMints = new Set<string>();
    let page = 1;

    while (true) {
      const response = await fetch(heliusDasUrl(apiKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "meatbags-companion-gc-mints",
          method: "searchAssets",
          params: {
            grouping: ["collection", GEOCACHE_COLLECTION_ADDRESS],
            page,
            limit: PAGE_LIMIT,
            burnt: true,
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

      for (const item of data.result.items) {
        allMints.add(item.id);
      }

      if (data.result.items.length < PAGE_LIMIT) break;
      page++;
    }

    console.log(`[helius] GeoCaches collection: ${allMints.size} total mints (including burned)`);
    return ok(allMints);
  } catch (error) {
    reportHeliusFailure();
    return err(
      "NETWORK_ERROR",
      error instanceof Error ? error.message : "Failed to fetch GeoCaches mints",
      true
    );
  }
};
