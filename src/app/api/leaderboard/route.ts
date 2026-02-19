import { NextResponse } from "next/server";
import type { LeaderboardRanking } from "@/types/leaderboard";

export async function GET() {
  try {
    // When Vercel Postgres is available, query the DB
    // For now, return empty array (DB setup happens on Vercel deploy)
    const rankings: LeaderboardRanking[] = [];

    // TODO: Uncomment when Vercel Postgres is connected:
    // const { db } = await import("@/db");
    // const { leaderboardEntries } = await import("@/db/schema");
    // const entries = await db
    //   .select()
    //   .from(leaderboardEntries)
    //   .orderBy(desc(leaderboardEntries.totalNfts))
    //   .limit(100);
    //
    // rankings = entries.map((entry, index) => ({
    //   ...entry,
    //   rank: index + 1,
    // }));

    return NextResponse.json({ success: true, data: rankings });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : "Database error",
        },
      },
      { status: 500 }
    );
  }
}
