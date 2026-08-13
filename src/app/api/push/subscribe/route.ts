import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasVapidKeys, vapidDetails } from "@/lib/push";
import {
  reassignPendingRemindersToSubscription,
  saveUserPushSubscription,
} from "@/lib/push-store";
import { syncUpcomingFestivalPushNotifications } from "@/lib/notification-schedules";

export const runtime = "nodejs";

// GET /api/push/subscribe — Returns the server's VAPID Public Key for client-side subscription
export async function GET() {
  return NextResponse.json({
    publicKey: vapidDetails.publicKey,
    configured: hasVapidKeys,
  });
}

const subscribeSchema = z.object({
  subscription: z.any(),
  previousEndpoint: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const savedSubscription = await saveUserPushSubscription(
      user.id,
      parsed.data.subscription
    );
    const reassignment = await reassignPendingRemindersToSubscription(
      user.id,
      parsed.data.previousEndpoint,
      savedSubscription.id
    );
    await syncUpcomingFestivalPushNotifications(user.id);
    return NextResponse.json({ success: true, reassignment });
  } catch (error) {
    console.error("[Push Subscribe Error]:", error);
    return NextResponse.json(
      { error: "Could not save push subscription" },
      { status: 500 }
    );
  }
}
