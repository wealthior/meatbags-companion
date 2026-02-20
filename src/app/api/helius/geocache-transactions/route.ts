import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/utils/env";
import { fetchGeocacheTransactions } from "@/lib/solana/helius-client";
import { isValidSolanaAddress } from "@/lib/utils/validation";

export const dynamic = "force-dynamic";

/**
 * GET /api/helius/geocache-transactions?address=<address>
 * Fetches geocache-specific transaction history for a wallet.
 * Uses paginated Helius Enhanced Transactions API with manual
 * Metaplex Core transaction parsing (Helius classifies Core txs as "UNKNOWN").
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const address = searchParams.get("address");

  if (!address || !isValidSolanaAddress(address)) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_WALLET_ADDRESS", message: "Invalid wallet address" } },
      { status: 400 },
    );
  }

  const { HELIUS_API_KEY } = getServerEnv();
  const result = await fetchGeocacheTransactions(HELIUS_API_KEY, address);

  if (!result.success) {
    console.error("[helius/geocache-transactions] Error:", result.error.message);
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json(result);
}
