import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/utils/env";
import { fetchNftsByOwner, fetchAssetDetails } from "@/lib/solana/helius-client";
import { isValidSolanaAddress } from "@/lib/utils/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ownerAddress = searchParams.get("owner");
  const mintAddress = searchParams.get("mint");
  const { HELIUS_API_KEY } = getServerEnv();

  // Single mint lookup (for escrow'd listed NFTs)
  if (mintAddress) {
    if (!isValidSolanaAddress(mintAddress)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_MINT", message: "Invalid mint address" } },
        { status: 400 }
      );
    }
    console.log(`[helius/assets] Fetching single mint: ${mintAddress.slice(0, 8)}...`);
    const result = await fetchAssetDetails(HELIUS_API_KEY, mintAddress);
    if (!result.success) {
      console.error(`[helius/assets] Mint lookup failed: ${result.error.message}`);
      return NextResponse.json(result, { status: 502 });
    }
    console.log(`[helius/assets] Mint lookup success: ${result.data.name}`);
    return NextResponse.json(result);
  }

  // Owner wallet lookup
  if (!ownerAddress || !isValidSolanaAddress(ownerAddress)) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_WALLET_ADDRESS", message: "Invalid wallet address" } },
      { status: 400 }
    );
  }

  const result = await fetchNftsByOwner(HELIUS_API_KEY, ownerAddress);

  if (!result.success) {
    console.error("[helius/assets] Error:", result.error.message);
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json(result);
}
