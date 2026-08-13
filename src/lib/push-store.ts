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

export interface ScheduledPushInput {
  id: string;
  userId: string;
  title: string;
  note?: string;
  remindAt: Date | string | null | undefined;
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

export function replacementReminderId(
  reminderId: string,
  previousSubscriptionId: string,
  nextSubscriptionId: string
) {
  const previousSuffix = `:${previousSubscriptionId}`;
  if (!reminderId.endsWith(previousSuffix)) return reminderId;

  return `${reminderId.slice(0, -previousSuffix.length)}:${nextSubscriptionId}`;
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

export async function saveUserPushSubscription(
  userId: string,
  subscriptionInput: PushSubscriptionInput
) {
  const subscription = parseSubscription(subscriptionInput);
  return db.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      userId,
      auth: subscription.auth,
      p256dh: subscription.p256dh,
    },
    create: {
      userId,
      endpoint: subscription.endpoint,
      auth: subscription.auth,
      p256dh: subscription.p256dh,
    },
  });
}

export async function deletePushSubscription(subscriptionId: string) {
  return db.pushSubscription.deleteMany({
    where: { id: subscriptionId },
  });
}

export async function reassignPendingRemindersToSubscription(
  userId: string,
  previousEndpoint: string | null | undefined,
  nextSubscriptionId: string
) {
  if (!previousEndpoint) return { reassigned: 0, deletedSubscriptions: 0 };

  const previousSubscription = await db.pushSubscription.findFirst({
    where: { userId, endpoint: previousEndpoint },
    select: { id: true },
  });

  if (!previousSubscription || previousSubscription.id === nextSubscriptionId) {
    return { reassigned: 0, deletedSubscriptions: 0 };
  }

  const pendingReminders = await db.pushReminder.findMany({
    where: {
      userId,
      subscriptionId: previousSubscription.id,
      firedAt: null,
      cancelledAt: null,
    },
    select: {
      id: true,
      title: true,
      note: true,
      remindAt: true,
    },
  });

  const deletedSubscriptions = await db.$transaction(async (tx) => {
    for (const reminder of pendingReminders) {
      const nextReminderId = replacementReminderId(
        reminder.id,
        previousSubscription.id,
        nextSubscriptionId
      );

      if (nextReminderId === reminder.id) {
        await tx.pushReminder.update({
          where: { id: reminder.id },
          data: { subscriptionId: nextSubscriptionId },
        });
      } else {
        await tx.pushReminder.upsert({
          where: { id: nextReminderId },
          update: {
            userId,
            subscriptionId: nextSubscriptionId,
            title: reminder.title,
            note: reminder.note,
            remindAt: reminder.remindAt,
            firedAt: null,
            cancelledAt: null,
          },
          create: {
            id: nextReminderId,
            userId,
            subscriptionId: nextSubscriptionId,
            title: reminder.title,
            note: reminder.note,
            remindAt: reminder.remindAt,
          },
        });

        await tx.pushReminder.delete({
          where: { id: reminder.id },
        });
      }
    }

    const deleted = await tx.pushSubscription.deleteMany({
      where: { id: previousSubscription.id, userId },
    });
    return deleted.count;
  });

  return {
    reassigned: pendingReminders.length,
    deletedSubscriptions,
  };
}

export async function schedulePushForUser(input: ScheduledPushInput) {
  if (!input.remindAt) return 0;

  const remindAt =
    input.remindAt instanceof Date ? input.remindAt : new Date(input.remindAt);
  if (Number.isNaN(remindAt.getTime()) || remindAt.getTime() <= Date.now()) {
    await cancelPushRemindersByPrefix(input.id, input.userId);
    return 0;
  }

  const subscriptions = await db.pushSubscription.findMany({
    where: { userId: input.userId },
    select: { id: true },
  });

  if (subscriptions.length === 0) return 0;

  await db.$transaction(
    subscriptions.map((subscription) =>
      db.pushReminder.upsert({
        where: { id: `${input.id}:${subscription.id}` },
        update: {
          title: input.title,
          note: input.note ?? "",
          remindAt,
          firedAt: null,
          cancelledAt: null,
        },
        create: {
          id: `${input.id}:${subscription.id}`,
          userId: input.userId,
          subscriptionId: subscription.id,
          title: input.title,
          note: input.note ?? "",
          remindAt,
        },
      })
    )
  );

  return subscriptions.length;
}

export async function cancelPushRemindersByPrefix(prefix: string, userId: string) {
  await db.pushReminder.updateMany({
    where: {
      userId,
      id: { startsWith: `${prefix}:` },
      firedAt: null,
      cancelledAt: null,
    },
    data: { cancelledAt: new Date() },
  });
}

export async function cancelPushReminder(id: string, userId: string) {
  await db.pushReminder.updateMany({
    where: {
      userId,
      OR: [{ id }, { id: { startsWith: `${id}:` } }],
      firedAt: null,
    },
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
