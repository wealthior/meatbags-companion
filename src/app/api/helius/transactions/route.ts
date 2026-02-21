import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/utils/env";
import { fetchTransactionHistory } from "@/lib/solana/helius-client";
import { isValidSolanaAddress } from "@/lib/utils/validation";
import type { NftTransaction } from "@/types/transaction";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = parseInt(searchParams.get("limit") ?? "100", 10);
  const typesParam = searchParams.get("types");
  const types = typesParam ? typesParam.split(",") : undefined;

  // Support both single address and comma-separated addresses
  const addressParam = searchParams.get("address") ?? searchParams.get("addresses") ?? "";
  const addresses = addressParam.split(",").filter(Boolean);

  if (addresses.length === 0 || !addresses.every(isValidSolanaAddress)) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_WALLET_ADDRESS", message: "Invalid wallet address(es)" } },
      { status: 400 }
    );
  }

  const { HELIUS_API_KEY } = getServerEnv();

  // Fetch all wallets in parallel on the server
  const results = await Promise.allSettled(
    addresses.map((addr: string) => fetchTransactionHistory(HELIUS_API_KEY, addr, { limit, types }))
  );

  const allTxns: NftTransaction[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && result.value.success) {
      allTxns.push(...result.value.data);
    }
  }

  // Deduplicate by signature
  const seen = new Set<string>();
  const unique = allTxns.filter((tx) => {
    if (seen.has(tx.signature)) return false;
    seen.add(tx.signature);
    return true;
  });

  unique.sort((a, b) => b.timestamp - a.timestamp);

  return NextResponse.json({ success: true, data: unique });
}
