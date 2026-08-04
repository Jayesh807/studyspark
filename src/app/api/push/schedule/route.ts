import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendNotificationToSubscription } from "@/lib/push";
import {
  savePushReminder,
  cancelPushReminder,
  getDueReminders,
  markReminderFired,
} from "@/lib/push-store";

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

// Timers cache to trigger Web Push right on time even if app is closed
const activeServerTimers = new Map<string, NodeJS.Timeout>();

export async function POST(req: NextRequest) {
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
      cancelPushReminder(reminder.id);
      if (activeServerTimers.has(reminder.id)) {
        clearTimeout(activeServerTimers.get(reminder.id)!);
        activeServerTimers.delete(reminder.id);
      }
      return NextResponse.json({ success: true, message: "Cancelled" });
    }

    // Schedule a background Web Push
    if (action === "SCHEDULE" && reminder && subscription) {
      const remindTime = new Date(reminder.remindAt).getTime();
      const delay = remindTime - Date.now();

      savePushReminder({
        id: reminder.id,
        title: reminder.title,
        note: reminder.note,
        remindAt: reminder.remindAt,
        subscription,
        fired: false,
        createdAt: new Date().toISOString(),
      });

      if (delay > 0) {
        if (activeServerTimers.has(reminder.id)) {
          clearTimeout(activeServerTimers.get(reminder.id)!);
        }

        // Set server timer for the exact notification moment
        const timer = setTimeout(async () => {
          await sendNotificationToSubscription(subscription, {
            title: `Reminder: ${reminder.title}`,
            body: reminder.note || "Time for your scheduled study task!",
            url: "/",
          });
          markReminderFired(reminder.id);
          activeServerTimers.delete(reminder.id);
        }, delay);

        activeServerTimers.set(reminder.id, timer);
      }

      return NextResponse.json({
        success: true,
        message: "Background Web Push scheduled",
        scheduledInMs: Math.max(0, delay),
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
