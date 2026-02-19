import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/utils/env";
import { fetchTransactionHistory } from "@/lib/solana/helius-client";
import { isValidSolanaAddress } from "@/lib/utils/validation";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const address = searchParams.get("address");
  const before = searchParams.get("before") ?? undefined;
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  if (!address || !isValidSolanaAddress(address)) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_WALLET_ADDRESS", message: "Invalid wallet address" } },
      { status: 400 }
    );
  }

  const { HELIUS_API_KEY } = getServerEnv();
  const result = await fetchTransactionHistory(HELIUS_API_KEY, address, before, limit);

  if (!result.success) {
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json(result);
}
