import { NextRequest, NextResponse } from "next/server";
import { fetchCurrentSolPrice, fetchHistoricalPrices } from "@/lib/api/price-service";
import type { PriceRange } from "@/types/price";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const range = searchParams.get("range") as PriceRange | null;

  if (range) {
    const validRanges: PriceRange[] = ["7d", "30d", "90d", "1y", "all"];
    if (!validRanges.includes(range)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid range" } },
        { status: 400 }
      );
    }

    const result = await fetchHistoricalPrices(range);
    if (!result.success) {
      return NextResponse.json(result, { status: 502 });
    }
    return NextResponse.json(result);
  }

  const result = await fetchCurrentSolPrice();
  if (!result.success) {
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json(result);
}
