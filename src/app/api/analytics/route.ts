import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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

  // Today's tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTodos = todos.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const completedTodos = todos.filter((t) => t.status === "completed").length;

  // Upcoming exams (next 30 days)
  const now = new Date();
  const upcomingExams = exams
    .filter((e) => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // Focus time today (minutes)
  const focusToday = focusSessions
    .filter((s) => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime() && s.type === "focus";
    })
    .reduce((sum, s) => sum + s.duration, 0);

  // Weekly study hours (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  const weeklyData = Array.from({ length: 7 }).map((_, i) => {
    const day = new Date(weekAgo);
    day.setDate(day.getDate() + i);
    day.setHours(0, 0, 0, 0);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);

    const dayMinutes = focusSessions
      .filter((s) => {
        const d = new Date(s.date);
        return d >= day && d < next && s.type === "focus";
      })
      .reduce((sum, s) => sum + s.duration, 0);

    return {
      day: day.toLocaleDateString("en-US", { weekday: "short" }),
      hours: Math.round((dayMinutes / 60) * 10) / 10,
      date: day.toISOString(),
    };
  });

  // Monthly study hours (last 30 days, grouped by day)
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 29);
  monthAgo.setHours(0, 0, 0, 0);

  const monthlyData = Array.from({ length: 30 }).map((_, i) => {
    const day = new Date(monthAgo);
    day.setDate(day.getDate() + i);
    day.setHours(0, 0, 0, 0);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);

    const dayMinutes = focusSessions
      .filter((s) => {
        const d = new Date(s.date);
        return d >= day && d < next && s.type === "focus";
      })
      .reduce((sum, s) => sum + s.duration, 0);

    return {
      day: day.getDate().toString(),
      hours: Math.round((dayMinutes / 60) * 10) / 10,
      date: day.toISOString(),
    };
  });

  // Subject performance
  const subjectPerformance = subjects.map((s) => ({
    name: s.name,
    progress: s.progress,
    attendance: s.attendance,
    color: s.color,
    credits: s.credits,
  }));

  // Task completion by category
  const categoryStats = ["general", "study", "assignment", "revision", "exam"].map(
    (cat) => {
      const catTodos = todos.filter((t) => t.category === cat);
      return {
        category: cat,
        total: catTodos.length,
        completed: catTodos.filter((t) => t.status === "completed").length,
      };
    }
  );

  // Task completion by priority
  const priorityStats = ["low", "medium", "high"].map((p) => {
    const pTodos = todos.filter((t) => t.priority === p);
    return {
      priority: p,
      total: pTodos.length,
      completed: pTodos.filter((t) => t.status === "completed").length,
    };
  });

  // Task completion trend (last 14 days)
  const trendData = Array.from({ length: 14 }).map((_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (13 - i));
    day.setHours(0, 0, 0, 0);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);

    const dayTodos = todos.filter((t) => {
      if (!t.updatedAt) return false;
      const d = new Date(t.updatedAt);
      return d >= day && d < next && t.status === "completed";
    });

    return {
      day: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      completed: dayTodos.length,
    };
  });

  // Focus distribution by subject
  const focusBySubject = subjects
    .map((s) => {
      const minutes = focusSessions
        .filter((f) => f.subject === s.name && f.type === "focus")
        .reduce((sum, f) => sum + f.duration, 0);
      return {
        name: s.name,
        hours: Math.round((minutes / 60) * 10) / 10,
        color: s.color,
      };
    })
    .filter((s) => s.hours > 0)
    .sort((a, b) => b.hours - a.hours);

  // Exam progress
  const examProgress = exams.map((e) => ({
    name: e.examName,
    subject: e.subject,
    progress: e.progress,
    date: e.date,
    priority: e.priority,
  }));

  // Totals
  const totalFocusMinutes = focusSessions
    .filter((s) => s.type === "focus")
    .reduce((sum, s) => sum + s.duration, 0);

  const weeklyFocusMinutes = focusSessions
    .filter((s) => {
      const d = new Date(s.date);
      return d >= weekAgo && s.type === "focus";
    })
    .reduce((sum, s) => sum + s.duration, 0);

  const monthlyFocusMinutes = focusSessions
    .filter((s) => {
      const d = new Date(s.date);
      return d >= monthAgo && s.type === "focus";
    })
    .reduce((sum, s) => sum + s.duration, 0);

  return NextResponse.json({
    stats: {
      todayTasks: todayTodos.length,
      completedTasks: completedTodos,
      totalTasks: todos.length,
      upcomingExams: upcomingExams.length,
      focusTodayMinutes: focusToday,
      totalFocusHours: Math.round((totalFocusMinutes / 60) * 10) / 10,
      weeklyFocusHours: Math.round((weeklyFocusMinutes / 60) * 10) / 10,
      monthlyFocusHours: Math.round((monthlyFocusMinutes / 60) * 10) / 10,
      studyStreak: profile?.studyStreak ?? 0,
      targetHours: profile?.targetHours ?? 6,
    },
    weeklyData,
    monthlyData,
    subjectPerformance,
    categoryStats,
    priorityStats,
    trendData,
    focusBySubject,
    examProgress,
    upcomingExams: upcomingExams.map((e) => ({
      ...e,
      date: e.date.toISOString(),
    })),
  });
}
