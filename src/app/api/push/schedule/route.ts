import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { sendNotificationToSubscription } from "@/lib/push";
import {
  savePushReminder,
  cancelPushReminder,
  getDueReminders,
  markReminderFired,
  toWebPushSubscription,
} from "@/lib/push-store";
import { syncDailyEngagementNotifications } from "@/lib/engagement-notifications";

export const runtime = "nodejs";

const scheduleSchema = z.object({
  action: z.enum(["SCHEDULE", "CANCEL", "TEST_PUSH"]),
  reminder: z
    .object({
      id: z.string(),
      title: z.string(),
      note: z.string().optional(),
      remindAt: z.string(),
    })
    .optional(),
  subscription: z.any().optional(),
});

async function dispatchDueReminders() {
  const due = await getDueReminders();
  let sent = 0;
  let failed = 0;

  for (const reminder of due) {
    const result = await sendNotificationToSubscription(
      toWebPushSubscription(reminder.subscription),
      {
        title: `Reminder: ${reminder.title}`,
        body: reminder.note || "Time for your scheduled study task!",
        url: "/",
      }
    );

    if (result.success) {
      sent += 1;
      await markReminderFired(reminder.id);
    } else {
      failed += 1;
    }
  }

  return { due: due.length, sent, failed };
}

function isCronRequest(req: NextRequest) {
  const secret = process.env.PUSH_CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shouldRefreshEngagement = new Date().getMinutes() === 0;
  const engagement = shouldRefreshEngagement
    ? await syncDailyEngagementNotifications()
    : { skipped: true };
  const result = await dispatchDueReminders();
  return NextResponse.json({ success: true, engagement, ...result });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = scheduleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { action, reminder, subscription } = parsed.data;

    // Direct test notification trigger
    if (action === "TEST_PUSH") {
      if (!subscription) {
        return NextResponse.json(
          { error: "Push subscription required" },
          { status: 400 }
        );
      }

      const res = await sendNotificationToSubscription(subscription, {
        title: "StudySpark Web Push 🔔",
        body: "Success! Web Push is connected. You will receive alerts even when the app is completely closed.",
        url: "/",
      });

      return NextResponse.json(res);
    }

    // Cancel an existing scheduled push
    if (action === "CANCEL" && reminder?.id) {
      await cancelPushReminder(reminder.id, user.id);
      return NextResponse.json({ success: true, message: "Cancelled" });
    }

    // Schedule a background Web Push
    if (action === "SCHEDULE" && reminder && subscription) {
      await savePushReminder({
        id: reminder.id,
        userId: user.id,
        title: reminder.title,
        note: reminder.note,
        remindAt: reminder.remindAt,
        subscription,
      });

      return NextResponse.json({
        success: true,
        message: "Background Web Push saved",
      });
    }

    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  } catch (error) {
    console.error("[Push Schedule API Error]:", error);
    return NextResponse.json(
      { error: "Could not process notification schedule" },
      { status: 500 }
    );
  }
}
