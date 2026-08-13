"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlarmClock,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { getOrRegisterPushSubscription } from "@/lib/push-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { playBell } from "./pages/focus-timer";

interface Reminder {
  id: string;
  title: string;
  note: string;
  remindAt: string;
  createdAt: string;
  fired: boolean;
}

interface ReminderWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

const REMINDER_KEY_PREFIX = "studyspark:reminders:";
const FIELD_CLASS =
  "rounded-[5px] border-border/50 bg-muted/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:bg-background/75 focus-visible:border-violet-400/70 focus-visible:ring-violet-500/20";
const LABEL_CLASS = "text-sm font-semibold text-foreground/90";
const DIALOG_CLASS =
  "w-[calc(100vw-1.5rem)] max-w-[560px] rounded-[14px] max-h-[calc(100dvh-1.5rem)] overflow-hidden border-white/60 bg-background/92 p-0 shadow-2xl shadow-slate-950/15 backdrop-blur-2xl dark:border-white/10 dark:bg-background/90";
const REMINDER_SOUND_REPEATS = 4;
const REMINDER_SOUND_GAP_MS = 900;

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function timeInputValue() {
  const date = new Date(Date.now() + 15 * 60 * 1000);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatReminderTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid time";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function readReminders(storageKey: string): Reminder[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Reminder[]) : [];
  } catch {
    return [];
  }
}

function writeReminders(storageKey: string, reminders: Reminder[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(reminders));
}

async function syncReminderWithServiceWorker(
  reminder: Reminder,
  action: "SCHEDULE_REMINDER" | "CANCEL_REMINDER",
  existingSubscription?: PushSubscription | null
) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  // 1. Post to local Service Worker thread
  const message = {
    type: action,
    payload: {
      id: reminder.id,
      title: reminder.title,
      note: reminder.note,
      remindAt: reminder.remindAt,
    },
  };

  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  } else {
    navigator.serviceWorker.ready
      .then((reg) => {
        reg.active?.postMessage(message);
      })
      .catch(() => undefined);
  }

  // 2. Persist with Server Web Push API for background notifications when app is closed
  try {
    const subscription =
      existingSubscription ?? (await getOrRegisterPushSubscription());
    if (subscription) {
      await fetch("/api/push/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action === "SCHEDULE_REMINDER" ? "SCHEDULE" : "CANCEL",
          reminder: {
            id: reminder.id,
            title: reminder.title,
            note: reminder.note,
            remindAt: reminder.remindAt,
          },
          subscription,
        }),
      });
    }
  } catch {
    // Graceful fallback to client-side SW
  }
}

export function ReminderWidget({ open, onOpenChange, userId }: ReminderWidgetProps) {
  const storageKey = `${REMINDER_KEY_PREFIX}${userId || "guest"}`;
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayInputValue);
  const [time, setTime] = useState(timeInputValue);
  const [note, setNote] = useState("");

  const upcomingCount = useMemo(
    () => reminders.filter((r) => !r.fired && new Date(r.remindAt).getTime() > Date.now()).length,
    [reminders]
  );

  const sortedReminders = useMemo(
    () =>
      [...reminders].sort(
        (a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime()
      ),
    [reminders]
  );

  const persist = useCallback(
    (next: Reminder[]) => {
      setReminders(next);
      writeReminders(storageKey, next);
    },
    [storageKey]
  );

  useEffect(() => {
    const loaded = readReminders(storageKey);
    const loadTimer = window.setTimeout(() => setReminders(loaded), 0);
    loaded.forEach((r) => {
      if (!r.fired && new Date(r.remindAt).getTime() > Date.now()) {
        void syncReminderWithServiceWorker(r, "SCHEDULE_REMINDER");
      }
    });

    return () => window.clearTimeout(loadTimer);
  }, [storageKey]);

  const sendTestNotification = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Your browser does not support desktop notifications.");
      return;
    }

    let perm = Notification.permission;
    if (perm === "default") {
      perm = await Notification.requestPermission();
    }

    if (perm !== "granted") {
      toast.error("Notification permission is blocked. Please allow notifications in your browser settings.");
      return;
    }

    playBell("focus-end");
    toast.success("Test notification sent!", {
      description: "You should see a system push notification banner now.",
    });

    const titleText = "StudySpark Test Notification 🔔";
    const bodyText = "Success! Notifications are working properly on your phone.";

    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready
        .then((reg) => {
          void reg.showNotification(titleText, {
            body: bodyText,
            icon: "/icon-192.png",
            badge: "/favicon-48x48.png",
            vibrate: [100, 50, 100],
            tag: "studyspark-test-notification",
            data: { url: "/" },
          } as NotificationOptions);
        })
        .catch(() => {
          const notif = new Notification(titleText, { body: bodyText, icon: "/favicon.ico" });
          notif.onclick = () => {
            window.focus();
            notif.close();
          };
        });
    } else {
      const desktopNotification = new Notification(titleText, {
        body: bodyText,
        icon: "/favicon.ico",
      });
      desktopNotification.onclick = () => {
        window.focus();
        desktopNotification.close();
      };
    }
  };

  const fireReminder = useCallback((reminder: Reminder) => {
    for (let i = 0; i < REMINDER_SOUND_REPEATS; i += 1) {
      window.setTimeout(() => playBell("focus-end"), i * REMINDER_SOUND_GAP_MS);
    }
    toast.success(`Reminder: ${reminder.title}`, {
      description: reminder.note || formatReminderTime(reminder.remindAt),
      duration: 12000,
    });

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      const title = `Reminder: ${reminder.title}`;
      const body = reminder.note || formatReminderTime(reminder.remindAt);

      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready
          .then((reg) => {
            void reg.showNotification(title, {
              body,
              icon: "/icon-192.png",
              badge: "/favicon-48x48.png",
              vibrate: [100, 50, 100],
              tag: `studyspark-reminder-${reminder.id}`,
              data: { url: "/" },
            } as NotificationOptions);
          })
          .catch(() => {
            const notif = new Notification(title, { body, icon: "/favicon.ico" });
            notif.onclick = () => {
              window.focus();
              notif.close();
            };
          });
      } else {
        const desktopNotification = new Notification(title, {
          body,
          icon: "/favicon.ico",
          tag: `studyspark-reminder-${reminder.id}`,
        });
        desktopNotification.onclick = () => {
          window.focus();
          desktopNotification.close();
        };
      }
    }
  }, []);

  useEffect(() => {
    if (!storageKey) return;
    const intervalId = window.setInterval(() => {
      const now = Date.now();
      let changed = false;
      const next = readReminders(storageKey).map((reminder) => {
        if (reminder.fired || new Date(reminder.remindAt).getTime() > now) return reminder;
        changed = true;
        fireReminder(reminder);
        return { ...reminder, fired: true };
      });

      if (changed) {
        writeReminders(storageKey, next);
        setReminders(next);
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [fireReminder, storageKey]);

  const handleAddReminder = async () => {
    const trimmedTitle = title.trim();
    const remindAt = new Date(`${date}T${time}`);

    if (!trimmedTitle) {
      toast.error("Please add a reminder title");
      return;
    }
    if (Number.isNaN(remindAt.getTime()) || remindAt.getTime() <= Date.now()) {
      toast.error("Choose a future reminder time");
      return;
    }

    const reminder: Reminder = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      note: note.trim(),
      remindAt: remindAt.toISOString(),
      createdAt: new Date().toISOString(),
      fired: false,
    };

    const subscription = await getOrRegisterPushSubscription();
    persist([reminder, ...reminders]);
    void syncReminderWithServiceWorker(
      reminder,
      "SCHEDULE_REMINDER",
      subscription
    );
    setTitle("");
    setDate(todayInputValue());
    setTime(timeInputValue());
    setNote("");
    toast.success("Reminder set", {
      description: subscription
        ? "Push notification will work even after the website is closed."
        : "Browser permission is needed for closed-website push alerts.",
    });
  };

  const handleDelete = (id: string) => {
    const target = reminders.find((r) => r.id === id);
    if (target) {
      syncReminderWithServiceWorker(target, "CANCEL_REMINDER");
    }
    persist(reminders.filter((reminder) => reminder.id !== id));
  };

  const handleClearDone = () => {
    persist(reminders.filter((reminder) => !reminder.fired));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={DIALOG_CLASS}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <ScrollArea className="max-h-[calc(100dvh-1.5rem)]">
        <div className="px-4 pt-5 pb-0 sm:px-7 sm:pt-7">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-3 text-xl tracking-tight">
              <span className="flex h-11 w-11 items-center justify-center rounded-[5px] bg-gradient-to-br from-violet-500/90 via-fuchsia-500/90 to-sky-500/80 text-white shadow-sm">
                <AlarmClock className="h-4 w-4" />
              </span>
              Reminders
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Set a time and StudySpark will show a popup reminder.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reminder-title" className={LABEL_CLASS}>
                Title <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="reminder-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Revise physics formulas"
                className={FIELD_CLASS}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="reminder-date" className={LABEL_CLASS}>
                  Date
                </Label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reminder-date"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className={cn(FIELD_CLASS, "pl-9")}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reminder-time" className={LABEL_CLASS}>
                  Time
                </Label>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reminder-time"
                    type="time"
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                    className={cn(FIELD_CLASS, "pl-9")}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reminder-note" className={LABEL_CLASS}>
                Note
              </Label>
              <Textarea
                id="reminder-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional details"
                rows={2}
                className={cn(FIELD_CLASS, "resize-none")}
              />
            </div>
          </div>
        </div>

        <div className="border-y border-border/40 bg-muted/15 px-4 py-4 sm:px-7">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-semibold">Your Reminders</span>
              <Badge className="h-5 rounded-full bg-violet-500/15 px-2 text-xs text-violet-500">
                {upcomingCount}
              </Badge>
            </div>
            {reminders.some((reminder) => reminder.fired) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearDone}
                className="h-8 rounded-[5px] px-2.5 text-xs text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear done
              </Button>
            )}
          </div>

          <ScrollArea className="max-h-[180px] sm:max-h-[220px]">
            <div className="space-y-2 pr-3">
              {sortedReminders.length === 0 ? (
                <div className="rounded-[5px] border border-dashed border-border/60 bg-background/50 p-5 text-center text-sm text-muted-foreground">
                  No reminders yet.
                </div>
              ) : (
                sortedReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className={cn(
                      "flex items-start gap-3 rounded-[5px] border border-border/50 bg-background/70 p-3",
                      reminder.fired && "opacity-60"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px]",
                        reminder.fired
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-violet-500/10 text-violet-500"
                      )}
                    >
                      {reminder.fired ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlarmClock className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{reminder.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatReminderTime(reminder.remindAt)}
                      </p>
                      {reminder.note && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/80">
                          {reminder.note}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(reminder.id)}
                      className="h-8 w-8 rounded-[5px] text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                      aria-label="Delete reminder"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex-col gap-2 px-4 pb-5 pt-4 sm:flex-row sm:justify-between sm:px-7 sm:pb-7">
          <Button
            type="button"
            variant="secondary"
            onClick={sendTestNotification}
            className="h-11 justify-center gap-2 rounded-[5px] px-4 font-medium"
          >
            <BellRing className="h-4 w-4 text-violet-500" />
            Test Notification
          </Button>

          <div className="grid w-full grid-cols-2 gap-2 sm:ml-auto sm:flex sm:w-auto sm:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-[5px] px-3 sm:px-6"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={handleAddReminder}
              className="h-11 rounded-[5px] bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 sm:px-6"
            >
              <Plus className="h-4 w-4" />
              Add Reminder
            </Button>
          </div>
        </DialogFooter>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
