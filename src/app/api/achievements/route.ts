import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

interface BadgeDef {
  id: string;
  title: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  icon: string; // emoji
  category: "tasks" | "focus" | "streak" | "subjects" | "exams" | "special";
}

// All badge definitions — order is the display order
const BADGES: BadgeDef[] = [
  // Tasks
  { id: "first-task", title: "First Steps", description: "Create your very first task", tier: "bronze", icon: "🌱", category: "tasks" },
  { id: "task-master", title: "Task Master", description: "Complete 10 tasks", tier: "silver", icon: "✅", category: "tasks" },
  { id: "task-legend", title: "Task Legend", description: "Complete 50 tasks", tier: "gold", icon: "🏆", category: "tasks" },
  { id: "priority-hero", title: "Priority Hero", description: "Complete 5 high-priority tasks", tier: "silver", icon: "⚡", category: "tasks" },
  // Focus
  { id: "focus-rookie", title: "Focus Rookie", description: "Complete your first focus session", tier: "bronze", icon: "🎯", category: "focus" },
  { id: "focus-pro", title: "Focus Pro", description: "Complete 10 focus sessions", tier: "silver", icon: "🎧", category: "focus" },
  { id: "focus-marathon", title: "Marathon Runner", description: "Complete a 60-minute focus session", tier: "gold", icon: "🏃", category: "focus" },
  { id: "time-master", title: "Time Master", description: "Accumulate 10 total focus hours", tier: "gold", icon: "⏰", category: "focus" },
  { id: "time-lord", title: "Time Lord", description: "Accumulate 50 total focus hours", tier: "platinum", icon: "🌌", category: "focus" },
  // Streak
  { id: "streak-starter", title: "Streak Starter", description: "Reach a 3-day study streak", tier: "bronze", icon: "🔥", category: "streak" },
  { id: "on-fire", title: "On Fire", description: "Reach a 7-day study streak", tier: "silver", icon: "🔥", category: "streak" },
  { id: "unstoppable", title: "Unstoppable", description: "Reach a 30-day study streak", tier: "platinum", icon: "💎", category: "streak" },
  // Subjects
  { id: "subject-explorer", title: "Subject Explorer", description: "Add 3 subjects", tier: "bronze", icon: "📚", category: "subjects" },
  { id: "scholar", title: "Scholar", description: "Add 5 subjects", tier: "silver", icon: "🎓", category: "subjects" },
  { id: "high-achiever", title: "High Achiever", description: "All subjects above 70% progress", tier: "gold", icon: "🌟", category: "subjects" },
  { id: "perfect-attendance", title: "Perfect Attendance", description: "A subject with 100% attendance", tier: "gold", icon: "👤", category: "subjects" },
  // Exams
  { id: "exam-ready", title: "Exam Ready", description: "Reach 80% progress on an exam", tier: "silver", icon: "📝", category: "exams" },
  { id: "perfectionist", title: "Perfectionist", description: "Reach 100% progress on an exam", tier: "gold", icon: "💯", category: "exams" },
  // Special
  { id: "goal-crusher", title: "Goal Crusher", description: "Exceed your daily study goal", tier: "silver", icon: "🚀", category: "special" },
  { id: "night-owl", title: "Night Owl", description: "Study after 10 PM", tier: "bronze", icon: "🦉", category: "special" },
  { id: "early-bird", title: "Early Bird", description: "Study before 7 AM", tier: "bronze", icon: "🐦", category: "special" },
  { id: "well-rounded", title: "Well-Rounded", description: "Have tasks in all 5 categories", tier: "silver", icon: "🌈", category: "special" },
];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [todos, subjects, exams, events, focusSessions, profile] =
    await Promise.all([
      db.todo.findMany({ where: { userId: user.id } }),
      db.subject.findMany({ where: { userId: user.id } }),
      db.exam.findMany({ where: { userId: user.id } }),
      db.event.findMany({ where: { userId: user.id } }),
      db.focusSession.findMany({ where: { userId: user.id } }),
      db.profile.findUnique({ where: { userId: user.id } }),
    ]);

  const completedTodos = todos.filter((t) => t.status === "completed");
  const completedTodosCount = completedTodos.length;
  const highPriorityCompleted = completedTodos.filter(
    (t) => t.priority === "high"
  ).length;

  const focusSessionsList = focusSessions.filter((s) => s.type === "focus");
  const totalFocusMinutes = focusSessionsList.reduce(
    (sum, s) => sum + s.duration,
    0
  );
  const totalFocusHours = totalFocusMinutes / 60;
  const hasMarathon = focusSessionsList.some((s) => s.duration >= 60);

  const streak = profile?.studyStreak ?? 0;
  const targetHours = profile?.targetHours ?? 6;
  const targetMinutes = targetHours * 60;

  // Today's focus minutes
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const focusTodayMinutes = focusSessionsList
    .filter((s) => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    })
    .reduce((sum, s) => sum + s.duration, 0);

  // Night owl / early bird
  const hasNightOwl = focusSessionsList.some((s) => {
    const d = new Date(s.createdAt);
    return d.getHours() >= 22;
  });
  const hasEarlyBird = focusSessionsList.some((s) => {
    const d = new Date(s.createdAt);
    return d.getHours() < 7;
  });

  // Categories used
  const usedCategories = new Set(todos.map((t) => t.category));
  const allCategoriesUsed = ["general", "study", "assignment", "revision", "exam"].every(
    (c) => usedCategories.has(c as never)
  );

  // Subject-based checks
  const allSubjectsAbove70 =
    subjects.length >= 3 && subjects.every((s) => s.progress >= 70);
  const hasPerfectAttendance = subjects.some((s) => s.attendance >= 100);

  // Exam-based checks
  const hasExam80 = exams.some((e) => e.progress >= 80);
  const hasExam100 = exams.some((e) => e.progress >= 100);

  // Evaluate each badge
  const earnedMap: Record<string, boolean> = {
    "first-task": todos.length >= 1,
    "task-master": completedTodosCount >= 10,
    "task-legend": completedTodosCount >= 50,
    "priority-hero": highPriorityCompleted >= 5,
    "focus-rookie": focusSessionsList.length >= 1,
    "focus-pro": focusSessionsList.length >= 10,
    "focus-marathon": hasMarathon,
    "time-master": totalFocusHours >= 10,
    "time-lord": totalFocusHours >= 50,
    "streak-starter": streak >= 3,
    "on-fire": streak >= 7,
    "unstoppable": streak >= 30,
    "subject-explorer": subjects.length >= 3,
    "scholar": subjects.length >= 5,
    "high-achiever": allSubjectsAbove70,
    "perfect-attendance": hasPerfectAttendance,
    "exam-ready": hasExam80,
    "perfectionist": hasExam100,
    "goal-crusher": focusTodayMinutes >= targetMinutes && targetMinutes > 0,
    "night-owl": hasNightOwl,
    "early-bird": hasEarlyBird,
    "well-rounded": allCategoriesUsed,
  };

  // Persist newly-earned badges to DB so earnedAt survives across devices/sessions.
  // Fetch existing records, then create any that are newly earned but not yet recorded.
  const existingBadges = await db.badgeEarned.findMany({
    where: { userId: user.id },
  });
  const existingMap = new Map(existingBadges.map((b) => [b.badgeId, b.earnedAt]));
  const newlyEarnedIds = BADGES
    .map((b) => b.id)
    .filter((id) => earnedMap[id] && !existingMap.has(id));

  if (newlyEarnedIds.length > 0) {
    try {
      await db.badgeEarned.createMany({
        data: newlyEarnedIds.map((badgeId) => ({
          userId: user.id,
          badgeId,
        })),
      });
      // Merge the newly created (earnedAt = now) into existingMap for the response
      const now = new Date();
      for (const id of newlyEarnedIds) {
        existingMap.set(id, now);
      }
    } catch (error) {
      console.error("Failed to persist badge earned timestamps:", error);
      // Non-fatal — the badges are still computed correctly, just without persisted timestamps
    }
  }

  const badges = BADGES.map((def) => ({
    ...def,
    earned: !!earnedMap[def.id],
    earnedAt: existingMap.get(def.id) ?? null,
  }));

  const earnedCount = badges.filter((b) => b.earned).length;
  const totalCount = badges.length;
  const completionPct = Math.round((earnedCount / totalCount) * 100);

  // Tier counts
  const tierStats = (["bronze", "silver", "gold", "platinum"] as const).map(
    (tier) => {
      const tierBadges = badges.filter((b) => b.tier === tier);
      return {
        tier,
        earned: tierBadges.filter((b) => b.earned).length,
        total: tierBadges.length,
      };
    }
  );

  // Recently earned — sorted by earnedAt desc (most recent first)
  const recentBadges = badges
    .filter((b) => b.earned && b.earnedAt)
    .sort((a, b) => {
      const aTime = a.earnedAt ? new Date(a.earnedAt).getTime() : 0;
      const bTime = b.earnedAt ? new Date(b.earnedAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 6)
    .map((b) => ({ id: b.id, earnedAt: b.earnedAt }));

  // Progress toward next badges (for a few key ones)
  const progress: { id: string; current: number; target: number }[] = [
    { id: "task-master", current: Math.min(completedTodosCount, 10), target: 10 },
    { id: "focus-pro", current: Math.min(focusSessionsList.length, 10), target: 10 },
    { id: "time-master", current: Math.min(Math.round(totalFocusHours * 10) / 10, 10), target: 10 },
    { id: "on-fire", current: Math.min(streak, 7), target: 7 },
    { id: "scholar", current: Math.min(subjects.length, 5), target: 5 },
  ];

  return NextResponse.json({
    badges,
    stats: {
      earnedCount,
      totalCount,
      completionPct,
      tierStats,
      recentBadges,
    },
    progress,
    // Also surface a few key totals for the page header
    summary: {
      totalTasks: todos.length,
      completedTasks: completedTodosCount,
      totalFocusHours: Math.round(totalFocusHours * 10) / 10,
      focusSessions: focusSessionsList.length,
      streak,
      subjects: subjects.length,
      exams: exams.length,
    },
  });
}
