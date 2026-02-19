import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import { verifyWalletSchema } from "@/lib/utils/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifyWalletSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues.map((i) => i.message).join(", "),
          },
        },
        { status: 400 }
      );
    }

    const { walletAddress, signature, message, displayName } = parsed.data;

    // Verify the signature
    try {
      const publicKey = new PublicKey(walletAddress);
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = Buffer.from(signature, "base64");

      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey.toBytes()
      );

      if (!isValid) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VERIFICATION_FAILED", message: "Invalid signature" },
          },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VERIFICATION_FAILED", message: "Signature verification failed" },
        },
        { status: 400 }
      );
    }

    // TODO: When Vercel Postgres is connected, store verification and update leaderboard:
    // const { db } = await import("@/db");
    // const { verifiedHolders, leaderboardEntries } = await import("@/db/schema");
    //
    // 1. Upsert into verified_holders
    // 2. Count NFTs for all wallets belonging to this user
    // 3. Upsert leaderboard_entries with new totals

    return NextResponse.json({
      success: true,
      data: {
        walletAddress,
        displayName,
        verified: true,
        message: "Wallet verified. Leaderboard will update once database is connected.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VERIFICATION_FAILED",
          message: error instanceof Error ? error.message : "Verification failed",
        },
      },
      { status: 500 }
    );
  }
}
