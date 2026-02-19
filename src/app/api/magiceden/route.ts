import { NextResponse } from "next/server";
import { fetchCollectionStats } from "@/lib/api/magiceden-service";

export async function GET() {
  const result = await fetchCollectionStats();

  if (!result.success) {
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json(result);
}
