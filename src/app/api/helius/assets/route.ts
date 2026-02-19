import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/utils/env";
import { fetchNftsByOwner } from "@/lib/solana/helius-client";
import { isValidSolanaAddress } from "@/lib/utils/validation";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ownerAddress = searchParams.get("owner");
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  if (!ownerAddress || !isValidSolanaAddress(ownerAddress)) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_WALLET_ADDRESS", message: "Invalid wallet address" } },
      { status: 400 }
    );
  }

  const { HELIUS_API_KEY } = getServerEnv();
  const result = await fetchNftsByOwner(HELIUS_API_KEY, ownerAddress, page);

  if (!result.success) {
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json(result);
}
