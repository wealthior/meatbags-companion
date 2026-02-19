import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Verified wallet ownership for the leaderboard */
export const verifiedHolders = pgTable(
  "verified_holders",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    walletAddress: text("wallet_address").notNull(),
    signature: text("signature").notNull(),
    verifiedAt: timestamp("verified_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("verified_holders_wallet_address_idx").on(table.walletAddress),
  ]
);

/** Aggregated leaderboard entries */
export const leaderboardEntries = pgTable(
  "leaderboard_entries",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    displayName: text("display_name").notNull(),
    totalNfts: integer("total_nfts").default(0).notNull(),
    verifiedWalletsCount: integer("verified_wallets_count").default(0).notNull(),
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("leaderboard_entries_user_id_idx").on(table.userId),
  ]
);
