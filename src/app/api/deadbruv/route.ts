import { NextRequest, NextResponse } from "next/server";
import { ok, err } from "@/types/api";
import type { DeadbruvUserBadge, DeadbruvBadgeDefinition } from "@/types/deadbruv";

const DEADBRUV_API = "https://www.deadbruv.com/api/supabase";

/**
 * Proxy to deadbruv.com Supabase API.
 * Avoids CORS issues and keeps the external dependency server-side.
 *
 * Supported queries:
 *   GET /api/deadbruv?table=UserBadge&walletAddress=X
 *   GET /api/deadbruv?table=Badge&badgeIds=A,B,C
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const table = searchParams.get("table");
  const walletAddress = searchParams.get("walletAddress");
  const badgeIds = searchParams.get("badgeIds");

  if (!table || !["UserBadge", "Badge"].includes(table)) {
    return NextResponse.json(
      err("VALIDATION_ERROR", "table must be UserBadge or Badge"),
      { status: 400 },
    );
  }

  // Build upstream URL
  const upstream = new URL(DEADBRUV_API);
  upstream.searchParams.set("table", table);

  if (table === "UserBadge") {
    if (!walletAddress) {
      return NextResponse.json(
        err("VALIDATION_ERROR", "walletAddress is required for UserBadge"),
        { status: 400 },
      );
    }
    upstream.searchParams.set("walletAddress", walletAddress);
  }

  if (table === "Badge" && badgeIds) {
    upstream.searchParams.set("badgeIds", badgeIds);
  }

  try {
    const response = await fetch(upstream.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 }, // Cache for 5 minutes on server
    });

    if (!response.ok) {
      return NextResponse.json(
        err("DEADBRUV_API_ERROR", `deadbruv API returned ${response.status}`, true),
        { status: 502 },
      );
    }

    const data: DeadbruvUserBadge[] | DeadbruvBadgeDefinition[] = await response.json();
    return NextResponse.json(ok(data));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      err("DEADBRUV_API_ERROR", `Failed to fetch from deadbruv: ${message}`, true),
      { status: 502 },
    );
  }
}
