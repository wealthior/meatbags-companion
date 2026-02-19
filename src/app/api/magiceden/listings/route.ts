import { NextRequest, NextResponse } from "next/server";
import { fetchCollectionListings } from "@/lib/api/magiceden-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sellers = searchParams.get("sellers");

  if (!sellers) {
    return NextResponse.json(
      { success: false, error: { code: "MISSING_PARAMS", message: "sellers parameter required" } },
      { status: 400 }
    );
  }

  const sellerAddresses = sellers.split(",").filter(Boolean);
  console.log(`[magiceden/listings] Checking listings for ${sellerAddresses.length} wallet(s)`);

  const result = await fetchCollectionListings(sellerAddresses);

  if (!result.success) {
    console.error(`[magiceden/listings] Error:`, result.error.message);
    return NextResponse.json(result, { status: 502 });
  }

  console.log(`[magiceden/listings] Returning ${result.data.length} listing(s)`);
  return NextResponse.json(result);
}
