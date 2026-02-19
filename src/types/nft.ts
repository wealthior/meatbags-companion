/** Mask color trait determining Prep Point yield */
export type MaskColor =
  | "Red"
  | "Purple"
  | "Orange"
  | "White"
  | "Yellow"
  | "Light Blue"
  | "Green"
  | "Teal"
  | "Olive"
  | "Blue"
  | "Black"
  | "Burgundy"
  | "Grey"
  | "Pink"
  | "Orchid"
  | "Navy"
  | "Brown"
  | "Gold"
  | "GH-Gold"
  | "1/1"
  | "Nothing";

export type MaskRarity = "Common" | "Uncommon" | "Rare" | "Legendary" | "Mythic";

export interface MaskColorConfig {
  readonly color: MaskColor;
  readonly dailyYield: number;
  readonly hexColor: string;
  readonly rarity: MaskRarity;
}

export interface NftTrait {
  readonly traitType: string;
  readonly value: string;
}

export type LoyaltyMultiplier = 1.2 | 1.1 | 1.0;

export interface LoyaltyCategory {
  readonly multiplier: LoyaltyMultiplier;
  readonly label: "Presale" | "Public Mint" | "Secondary";
}

export interface MeatbagNft {
  readonly mintAddress: string;
  readonly name: string;
  readonly imageUrl: string;
  readonly maskColor: MaskColor;
  readonly traits: readonly NftTrait[];
  readonly ownerWallet: string;
  readonly isHonorary: boolean;
  readonly isSoulbound: boolean;
  readonly isStaked: boolean;
  readonly stakingProgram?: string;
  readonly dailyYield: number;
  readonly magicEdenUrl: string;
}

export interface CollectionStats {
  readonly totalItems: number;
  readonly uniqueHolders: number;
  readonly floorPrice: number;
  readonly listedCount: number;
  readonly volume24h: number;
  readonly volume7d: number;
  readonly volume30d: number;
  readonly volumeAll: number;
}
