import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/utils/env";
import { fetchAllGeocacheMints } from "@/lib/solana/helius-client";

export const dynamic = "force-dynamic";

/**
 * GET /api/helius/geocache-mints
 * Fetches ALL GeoCaches collection mint addresses (including burned).
 * Used to identify geocache-related transactions in wallet history.
 * Cached client-side via TanStack Query (collection mints rarely change).
 */
export async function GET() {
  const { HELIUS_API_KEY } = getServerEnv();

  const result = await fetchAllGeocacheMints(HELIUS_API_KEY);

  if (!result.success) {
    console.error("[helius/geocache-mints] Error:", result.error.message);
    return NextResponse.json(result, { status: 502 });
  }

  // Convert Set to array for JSON serialization
  return NextResponse.json({
    success: true,
    data: { mints: [...result.data], total: result.data.size },
  });
}
