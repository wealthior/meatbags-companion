import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/utils/env";
import { fetchGeocachesByOwner } from "@/lib/solana/helius-client";
import { isValidSolanaAddress } from "@/lib/utils/validation";

export const dynamic = "force-dynamic";

/**
 * GET /api/helius/geocaches?owner=<address>
 * Fetches all GeoCaches NFTs owned by a wallet address.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ownerAddress = searchParams.get("owner");
  const { HELIUS_API_KEY } = getServerEnv();

  if (!ownerAddress || !isValidSolanaAddress(ownerAddress)) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_WALLET_ADDRESS", message: "Invalid wallet address" } },
      { status: 400 }
    );
  }

  const result = await fetchGeocachesByOwner(HELIUS_API_KEY, ownerAddress);

  if (!result.success) {
    console.error("[helius/geocaches] Error:", result.error.message);
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json(result);
}
