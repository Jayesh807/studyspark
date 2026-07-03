// Shared types matching the database models

export interface User {
  id: string;
  username: string;
  createdAt?: string;
}

export interface Profile {
  id: string;
  userId: string;
  bio: string;
  goal: string;
  targetHours: number;
  college: string;
  course: string;
  semester: number;
  avatar: string;
  studyStreak: number;
}

export type Priority = "low" | "medium" | "high";
export type TodoStatus = "todo" | "in-progress" | "completed";
export type TodoCategory =
  | "general"
  | "study"
  | "assignment"
  | "revision"
  | "exam";

export interface Todo {
  id: string;
  userId: string;
  title: string;
  description: string;
  priority: Priority;
  category: TodoCategory;
  status: TodoStatus;
  subject: string;
  dueDate: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type EventColor =
  | "violet"
  | "blue"
  | "green"
  | "amber"
  | "rose"
  | "cyan";

export interface Event {
  id: string;
  userId: string;
  title: string;
  date: string;
  time: string;
  description: string;
  color: EventColor;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  teacher: string;
  credits: number;
  attendance: number;
  color: EventColor;
  progress: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Exam {
  id: string;
  userId: string;
  subject: string;
  examName: string;
  date: string;
  time: string;
  location: string;
  priority: Priority;
  progress: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface FocusSession {
  id: string;
  userId: string;
  duration: number;
  date: string;
  completed: boolean;
  type: "focus" | "break";
  subject: string;
  createdAt: string;
}

export interface Analytics {
  stats: {
    todayTasks: number;
    completedTasks: number;
    totalTasks: number;
    upcomingExams: number;
    focusTodayMinutes: number;
    totalFocusHours: number;
    weeklyFocusHours: number;
    monthlyFocusHours: number;
    studyStreak: number;
    targetHours: number;
  };
  weeklyData: { day: string; hours: number; date: string }[];
  monthlyData: { day: string; hours: number; date: string }[];
  subjectPerformance: {
    name: string;
    progress: number;
    attendance: number;
    color: string;
    credits: number;
  }[];
  categoryStats: {
    category: string;
    total: number;
    completed: number;
  }[];
  priorityStats: {
    priority: string;
    total: number;
    completed: number;
  }[];
  trendData: { day: string; completed: number }[];
  focusBySubject: { name: string; hours: number; color: string }[];
  examProgress: {
    name: string;
    subject: string;
    progress: number;
    date: string;
    priority: string;
  }[];
  upcomingExams: Exam[];
}

// Color helpers
export const COLOR_MAP: Record<
  string,
  { bg: string; text: string; ring: string; dot: string; soft: string; chart: string }
> = {
  violet: {
    bg: "bg-violet-500",
    text: "text-violet-600 dark:text-violet-400",
    ring: "ring-violet-500/30",
    dot: "bg-violet-500",
    soft: "bg-violet-100 dark:bg-violet-500/15",
    chart: "#8b5cf6",
  },
  blue: {
    bg: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
    ring: "ring-blue-500/30",
    dot: "bg-blue-500",
    soft: "bg-blue-100 dark:bg-blue-500/15",
    chart: "#3b82f6",
  },
  green: {
    bg: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/30",
    dot: "bg-emerald-500",
    soft: "bg-emerald-100 dark:bg-emerald-500/15",
    chart: "#22c55e",
  },
  amber: {
    bg: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/30",
    dot: "bg-amber-500",
    soft: "bg-amber-100 dark:bg-amber-500/15",
    chart: "#f59e0b",
  },
  rose: {
    bg: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    ring: "ring-rose-500/30",
    dot: "bg-rose-500",
    soft: "bg-rose-100 dark:bg-rose-500/15",
    chart: "#f43f5e",
  },
  cyan: {
    bg: "bg-cyan-500",
    text: "text-cyan-600 dark:text-cyan-400",
    ring: "ring-cyan-500/30",
    dot: "bg-cyan-500",
    soft: "bg-cyan-100 dark:bg-cyan-500/15",
    chart: "#06b6d4",
  },
};

export function colorOf(c: string) {
  return COLOR_MAP[c] ?? COLOR_MAP.violet;
}

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; soft: string; text: string; dot: string }
> = {
  low: {
    label: "Low",
    color: "bg-sky-500",
    soft: "bg-sky-100 dark:bg-sky-500/15",
    text: "text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
  },
  medium: {
    label: "Medium",
    color: "bg-amber-500",
    soft: "bg-amber-100 dark:bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  high: {
    label: "High",
    color: "bg-rose-500",
    soft: "bg-rose-100 dark:bg-rose-500/15",
    text: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
  },
};

export const CATEGORY_CONFIG: Record<
  TodoCategory,
  { label: string; icon: string }
> = {
  general: { label: "General", icon: "📋" },
  study: { label: "Study", icon: "📚" },
  assignment: { label: "Assignment", icon: "✍️" },
  revision: { label: "Revision", icon: "🔄" },
  exam: { label: "Exam Prep", icon: "🎯" },
};
