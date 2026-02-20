import type { MaskColor, MaskColorConfig } from "@/types/nft";
import type { TierConfig } from "@/types/loserboard";

/** MeatBags on-chain collection address */
export const COLLECTION_ADDRESS = "Dn5qsJJj4mKBdYQiXFfrS5PSNPwAakK6XSpvAxqH6v2C";

/** MagicEden collection slug */
export const MAGICEDEN_SLUG = "meatbags";

/** MagicEden base URL for NFT details */
export const MAGICEDEN_ITEM_URL = "https://magiceden.io/item-details";

/** MagicEden collection URL */
export const MAGICEDEN_COLLECTION_URL = "https://magiceden.io/marketplace/meatbags";

/** Total NFTs in collection */
export const COLLECTION_TOTAL = 10_034;

/** Complete mask color configuration: color -> daily yield + display info */
export const MASK_COLOR_CONFIG: Record<MaskColor, MaskColorConfig> = {
  Red: { color: "Red", dailyYield: 1_000, hexColor: "#e53e3e", rarity: "Common" },
  Purple: { color: "Purple", dailyYield: 1_025, hexColor: "#9b59b6", rarity: "Common" },
  Orange: { color: "Orange", dailyYield: 1_050, hexColor: "#e67e22", rarity: "Common" },
  White: { color: "White", dailyYield: 1_075, hexColor: "#ecf0f1", rarity: "Common" },
  Yellow: { color: "Yellow", dailyYield: 1_100, hexColor: "#f1c40f", rarity: "Common" },
  "Light Blue": { color: "Light Blue", dailyYield: 1_125, hexColor: "#5dade2", rarity: "Common" },
  Green: { color: "Green", dailyYield: 1_150, hexColor: "#27ae60", rarity: "Common" },
  Teal: { color: "Teal", dailyYield: 1_175, hexColor: "#1abc9c", rarity: "Common" },
  Olive: { color: "Olive", dailyYield: 1_200, hexColor: "#808000", rarity: "Uncommon" },
  Blue: { color: "Blue", dailyYield: 1_225, hexColor: "#2980b9", rarity: "Uncommon" },
  Black: { color: "Black", dailyYield: 1_250, hexColor: "#7a8fa0", rarity: "Uncommon" },
  Burgundy: { color: "Burgundy", dailyYield: 1_275, hexColor: "#c0405a", rarity: "Uncommon" },
  Grey: { color: "Grey", dailyYield: 1_300, hexColor: "#95a5a6", rarity: "Uncommon" },
  Pink: { color: "Pink", dailyYield: 1_325, hexColor: "#e91e8c", rarity: "Uncommon" },
  Orchid: { color: "Orchid", dailyYield: 1_350, hexColor: "#da70d6", rarity: "Rare" },
  Navy: { color: "Navy", dailyYield: 1_375, hexColor: "#5a6abe", rarity: "Rare" },
  Brown: { color: "Brown", dailyYield: 1_400, hexColor: "#c07040", rarity: "Rare" },
  Gold: { color: "Gold", dailyYield: 4_200, hexColor: "#ffd700", rarity: "Legendary" },
  "GH-Gold": { color: "GH-Gold", dailyYield: 4_200, hexColor: "#daa520", rarity: "Legendary" },
  "1/1": { color: "1/1", dailyYield: 7_000, hexColor: "#9b30ff", rarity: "Mythic" },
  Nothing: { color: "Nothing", dailyYield: 7_700, hexColor: "#39ff14", rarity: "Mythic" },
};

/** All mask colors sorted by yield (ascending) */
export const MASK_COLORS_BY_YIELD: readonly MaskColor[] = Object.values(MASK_COLOR_CONFIG)
  .sort((a, b) => a.dailyYield - b.dailyYield)
  .map((c) => c.color);

/** Loserboard tier configurations */
export const TIER_CONFIGS: readonly TierConfig[] = [
  { tier: "Bronze", minPoints: 40, maxPoints: 24_000, color: "#cd7f32" },
  { tier: "Silver", minPoints: 25_000, maxPoints: 96_000, color: "#c0c0c0" },
  { tier: "Gold", minPoints: 100_000, maxPoints: 219_000, color: "#ffd700" },
  { tier: "Platinum", minPoints: 225_000, maxPoints: 392_000, color: "#e5e4e2" },
  { tier: "Immortal", minPoints: 400_000, maxPoints: Infinity, color: "#9b30ff" },
];

/** MeatBags mint phase timestamps (Unix seconds, UTC) */
export const PRESALE_START = 1729008000; // Oct 15, 2024 16:00 UTC
export const PRESALE_END = 1729011600; // Oct 15, 2024 17:00 UTC
export const PUBLIC_MINT_START = 1729011720; // Oct 15, 2024 17:02 UTC
export const PUBLIC_MINT_END = 1732726920; // Nov 27, 2024 17:02 UTC

/** Helius RPC endpoint (with API key placeholder) */
export const heliusRpcUrl = (apiKey: string) =>
  `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;

/** Helius DAS API endpoint */
export const heliusDasUrl = (apiKey: string) =>
  `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;

/** Public Solana RPC fallback */
export const PUBLIC_RPC_URL = "https://api.mainnet-beta.solana.com";

/** CoinGecko API base URL */
export const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";

/** GeoCaches collection address (raid rewards) */
export const GEOCACHE_COLLECTION_ADDRESS = "BXoFDUpxbrpAMVD8ivFRqCB6wGpLvhEC5o5BAFoaKgCU";

/** GeoCaches MagicEden collection slug */
export const GEOCACHE_MAGICEDEN_SLUG = "meatbags_geocache";

/** GeoCaches MagicEden collection URL */
export const GEOCACHE_MAGICEDEN_COLLECTION_URL = "https://magiceden.io/marketplace/meatbags_geocache";

/** Verification message template for leaderboard */
export const VERIFICATION_MESSAGE = (walletAddress: string, timestamp: number) =>
  `MeatBags Companion: Verify ownership of ${walletAddress} at ${timestamp}`;
