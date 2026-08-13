import { db } from "@/lib/db";
import { schedulePushForUser } from "@/lib/push-store";

type EngagementSlot = {
  id: string;
  hour: number;
  minute: number;
  title: (username: string) => string;
  notes: string[];
};

const IST_OFFSET_MINUTES = 5 * 60 + 30;

const ENGAGEMENT_SLOTS: EngagementSlot[] = [
  {
    id: "morning-plan",
    hour: 10,
    minute: 0,
    title: (username) => `Hello ${username}, add your today tasks`,
    notes: [
      "A clear task list makes the whole study day lighter.",
      "Plan 3 small wins for today and start with the easiest one.",
      "Open StudySpark and turn today's study goals into tasks.",
    ],
  },
  {
    id: "focus-push",
    hour: 14,
    minute: 0,
    title: () => "Ready for one focus session?",
    notes: [
      "Start a 25-minute session and protect your momentum.",
      "One focused block is enough to restart the day.",
      "Pick one topic and give it your full attention for 25 minutes.",
    ],
  },
  {
    id: "evening-review",
    hour: 19,
    minute: 0,
    title: () => "Review your study progress",
    notes: [
      "Check completed tasks and plan one priority for tomorrow.",
      "A quick review now makes tomorrow easier.",
      "Mark what you finished and clean up pending tasks.",
    ],
  },
  {
    id: "comeback",
    hour: 20,
    minute: 30,
    title: () => "Your study streak is waiting",
    notes: [
      "Complete one small task today to keep your rhythm alive.",
      "No need for a perfect day. One useful action is enough.",
      "Open StudySpark and finish one tiny study step.",
    ],
  },
];

function dateKeyInIst(date: Date) {
  const ist = new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

function scheduledIstDate(date: Date, hour: number, minute: number) {
  const [year, month, day] = dateKeyInIst(date).split("-").map(Number);
  return new Date(
    Date.UTC(year, month - 1, day, hour, minute) -
      IST_OFFSET_MINUTES * 60 * 1000
  );
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function pickNote(notes: string[], dateKey: string, slotId: string) {
  const seed = `${dateKey}:${slotId}`;
  const total = Array.from(seed).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0
  );
  return notes[total % notes.length];
}

export async function syncDailyEngagementNotifications() {
  const subscriptions = await db.pushSubscription.findMany({
    distinct: ["userId"],
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  const now = new Date();
  let scheduled = 0;

  for (const subscription of subscriptions) {
    const username = subscription.user.username || "there";

    for (const dayOffset of [0, 1]) {
      const targetDay = addDays(now, dayOffset);
      const dateKey = dateKeyInIst(targetDay);

      for (const slot of ENGAGEMENT_SLOTS) {
        const remindAt = scheduledIstDate(targetDay, slot.hour, slot.minute);
        const count = await schedulePushForUser({
          id: `engagement:${slot.id}:${dateKey}`,
          userId: subscription.user.id,
          title: slot.title(username),
          note: pickNote(slot.notes, dateKey, slot.id),
          remindAt,
        });
        scheduled += count;
      }
    }
  }

  return { users: subscriptions.length, scheduled };
}
