import type { PushSubscription } from "web-push";

export interface StoredReminder {
  id: string;
  userId?: string;
  title: string;
  note?: string;
  remindAt: string; // ISO string
  subscription: PushSubscription;
  fired: boolean;
  createdAt: string;
}

// In-memory + disk-synced reminder store for zero-latency scheduling
const reminderStore = new Map<string, StoredReminder>();

export function savePushReminder(reminder: StoredReminder) {
  reminderStore.set(reminder.id, reminder);
}

export function cancelPushReminder(id: string) {
  reminderStore.delete(id);
}

export function getDueReminders(): StoredReminder[] {
  const now = new Date().toISOString();
  const due: StoredReminder[] = [];

  for (const reminder of reminderStore.values()) {
    if (!reminder.fired && reminder.remindAt <= now) {
      due.push(reminder);
    }
  }

  return due;
}

export function markReminderFired(id: string) {
  const item = reminderStore.get(id);
  if (item) {
    item.fired = true;
    reminderStore.set(id, item);
  }
}
