import type { PushSubscription } from "web-push";
import { db } from "@/lib/db";

type PushSubscriptionInput = PushSubscription & {
  keys?: {
    auth?: string;
    p256dh?: string;
  };
};

export interface StoredReminderInput {
  id: string;
  userId: string;
  title: string;
  note?: string;
  remindAt: string;
  subscription: PushSubscriptionInput;
}

function parseSubscription(subscription: PushSubscriptionInput) {
  const endpoint = subscription.endpoint;
  const auth = subscription.keys?.auth;
  const p256dh = subscription.keys?.p256dh;

  if (!endpoint || !auth || !p256dh) {
    throw new Error("Invalid push subscription");
  }

  return { endpoint, auth, p256dh };
}

export function toWebPushSubscription(subscription: {
  endpoint: string;
  auth: string;
  p256dh: string;
}): PushSubscription {
  return {
    endpoint: subscription.endpoint,
    keys: {
      auth: subscription.auth,
      p256dh: subscription.p256dh,
    },
  };
}

export async function savePushReminder(reminder: StoredReminderInput) {
  const subscription = parseSubscription(reminder.subscription);
  const storedSubscription = await db.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      userId: reminder.userId,
      auth: subscription.auth,
      p256dh: subscription.p256dh,
    },
    create: {
      userId: reminder.userId,
      endpoint: subscription.endpoint,
      auth: subscription.auth,
      p256dh: subscription.p256dh,
    },
  });

  return db.pushReminder.upsert({
    where: { id: reminder.id },
    update: {
      userId: reminder.userId,
      subscriptionId: storedSubscription.id,
      title: reminder.title,
      note: reminder.note ?? "",
      remindAt: new Date(reminder.remindAt),
      firedAt: null,
      cancelledAt: null,
    },
    create: {
      id: reminder.id,
      userId: reminder.userId,
      subscriptionId: storedSubscription.id,
      title: reminder.title,
      note: reminder.note ?? "",
      remindAt: new Date(reminder.remindAt),
    },
  });
}

export async function cancelPushReminder(id: string, userId: string) {
  await db.pushReminder.updateMany({
    where: { id, userId, firedAt: null },
    data: { cancelledAt: new Date() },
  });
}

export async function getDueReminders(limit = 50) {
  return db.pushReminder.findMany({
    where: {
      remindAt: { lte: new Date() },
      firedAt: null,
      cancelledAt: null,
    },
    include: { subscription: true },
    orderBy: { remindAt: "asc" },
    take: limit,
  });
}

export async function markReminderFired(id: string) {
  await db.pushReminder.updateMany({
    where: { id, firedAt: null },
    data: { firedAt: new Date() },
  });
}
