import { cancelPushRemindersByPrefix, schedulePushForUser } from "@/lib/push-store";
import { getFestivalHolidays } from "@/lib/festivals";

type SchedulableTask = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status?: string;
  dueDate?: Date | string | null;
};

type SchedulableExam = {
  id: string;
  userId: string;
  subject: string;
  examName: string;
  date: Date | string;
  time?: string;
};

type SchedulableEvent = {
  id: string;
  userId: string;
  title: string;
  date: Date | string;
  time?: string;
  description?: string;
};

function atTime(dateValue: Date | string | null | undefined, time = "09:00") {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  const [hours, minutes] = time.split(":").map(Number);
  date.setHours(
    Number.isFinite(hours) ? hours : 9,
    Number.isFinite(minutes) ? minutes : 0,
    0,
    0
  );
  return date;
}

function dayBeforeAt(dateValue: Date | string, time = "09:00") {
  const date = atTime(dateValue, time);
  if (!date) return null;
  date.setDate(date.getDate() - 1);
  return date;
}

export async function syncTaskPushNotifications(task: SchedulableTask) {
  const prefix = `task:${task.id}:due`;
  if (!task.dueDate || task.status === "completed") {
    await cancelPushRemindersByPrefix(prefix, task.userId);
    return;
  }

  await schedulePushForUser({
    id: prefix,
    userId: task.userId,
    title: `Task due: ${task.title}`,
    note: task.description || "You have a task due today.",
    remindAt: atTime(task.dueDate),
  });
}

export async function cancelTaskPushNotifications(userId: string, taskId: string) {
  await cancelPushRemindersByPrefix(`task:${taskId}:due`, userId);
}

export async function syncExamPushNotifications(exam: SchedulableExam) {
  await schedulePushForUser({
    id: `exam:${exam.id}:tomorrow`,
    userId: exam.userId,
    title: `Exam tomorrow: ${exam.examName}`,
    note: exam.subject ? `Subject: ${exam.subject}` : "Prepare for your exam.",
    remindAt: dayBeforeAt(exam.date),
  });

  await schedulePushForUser({
    id: `exam:${exam.id}:start`,
    userId: exam.userId,
    title: `Exam starting: ${exam.examName}`,
    note: exam.subject ? `Subject: ${exam.subject}` : "Good luck!",
    remindAt: atTime(exam.date, exam.time || "09:00"),
  });
}

export async function cancelExamPushNotifications(userId: string, examId: string) {
  await cancelPushRemindersByPrefix(`exam:${examId}:tomorrow`, userId);
  await cancelPushRemindersByPrefix(`exam:${examId}:start`, userId);
}

export async function syncEventPushNotifications(event: SchedulableEvent) {
  await schedulePushForUser({
    id: `event:${event.id}:start`,
    userId: event.userId,
    title: `Calendar event: ${event.title}`,
    note: event.description || "You have a scheduled event.",
    remindAt: atTime(event.date, event.time || "09:00"),
  });
}

export async function cancelEventPushNotifications(userId: string, eventId: string) {
  await cancelPushRemindersByPrefix(`event:${eventId}:start`, userId);
}

export async function syncUpcomingFestivalPushNotifications(userId: string) {
  const now = new Date();
  const years = [now.getFullYear(), now.getFullYear() + 1];
  const festivals = (
    await Promise.all(years.map((year) => getFestivalHolidays(year, "IN")))
  )
    .flat()
    .filter((festival) => new Date(`${festival.date}T09:00:00`).getTime() > now.getTime())
    .sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    .slice(0, 30);

  await Promise.all(
    festivals.map((festival) =>
      schedulePushForUser({
        id: `festival:${festival.date}:${festival.name}`,
        userId,
        title: festival.name,
        note: `Upcoming festival: ${festival.name}`,
        remindAt: new Date(`${festival.date}T09:00:00`),
      })
    )
  );
}
