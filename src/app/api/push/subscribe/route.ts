import { NextResponse } from "next/server";
import { hasVapidKeys, vapidDetails } from "@/lib/push";

export const runtime = "nodejs";

// GET /api/push/subscribe — Returns the server's VAPID Public Key for client-side subscription
export async function GET() {
  return NextResponse.json({
    publicKey: vapidDetails.publicKey,
    configured: hasVapidKeys,
  });
}
