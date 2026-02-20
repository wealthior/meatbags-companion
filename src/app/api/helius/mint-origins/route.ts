import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/utils/env";
import { detectWalletMultiplier } from "@/lib/solana/loyalty-detector";
import { isValidSolanaAddress } from "@/lib/utils/validation";

/**
 * GET /api/helius/mint-origins?owner=<address>&mints=<mint1,mint2,...>
 *
 * Detects the loyalty multiplier for a wallet by checking if the owner
 * originally minted any of their NFTs during presale or public mint.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const owner = searchParams.get("owner");
  const mintsParam = searchParams.get("mints");

  if (!owner || !isValidSolanaAddress(owner)) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_WALLET_ADDRESS", message: "Invalid wallet address" } },
      { status: 400 }
    );
  }

  if (!mintsParam) {
    return NextResponse.json(
      { success: false, error: { code: "MISSING_MINTS", message: "Missing mints parameter" } },
      { status: 400 }
    );
  }

  const mints = mintsParam.split(",").filter(Boolean);
  if (mints.length === 0) {
    return NextResponse.json({ success: true, data: { multiplier: 1.0 } });
  }

  // Limit to 50 mints per request to prevent abuse
  const cappedMints = mints.slice(0, 50);

  const { HELIUS_API_KEY } = getServerEnv();
  const result = await detectWalletMultiplier(HELIUS_API_KEY, owner, cappedMints);

  if (!result.success) {
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json({ success: true, data: { multiplier: result.data } });
}
