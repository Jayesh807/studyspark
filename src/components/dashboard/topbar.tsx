"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Search,
  Bell,
  Download,
  Sun,
  Moon,
  Command,
  SlidersHorizontal,
  AlertTriangle,
  BookOpen,
  Target,
  Calculator as CalculatorIcon,
  Music,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAppStore, type AppView } from "@/lib/store";
import { apiFetch } from "@/lib/api";
import type { Analytics, Todo, Exam, FocusSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CalculatorWidget } from "./calculator";
import { LofiPlayer } from "./lofi-player";
import { PWA_INSTALL_REQUEST_EVENT } from "@/components/pwa-install-prompt";

/* -------------------------------------------------------------------------- */
/*  Types & helpers                                                            */
/* -------------------------------------------------------------------------- */

type NotificationKind = "overdue" | "exam" | "goal";

interface SmartNotification {
  id: string;
  kind: NotificationKind;
  message: string;
  relativeTime: string;
  navigateTo: AppView;
  read: boolean;
}

const FIVE_MINUTES = 5 * 60 * 1000;

interface CachedData {
  todos: Todo[];
  exams: Exam[];
  analytics: Analytics | null;
  focusSessions: FocusSession[];
  fetchedAt: number;
}

let cachedData: CachedData | null = null;

async function fetchNotificationData(): Promise<CachedData> {
  const now = Date.now();
  if (cachedData && now - cachedData.fetchedAt < FIVE_MINUTES) {
    return cachedData;
  }

  const [todosRes, examsRes, analyticsRes, sessionsRes] = await Promise.all([
    apiFetch<{ todos: Todo[] }>("/api/todos").catch(() => ({ todos: [] as Todo[] })),
    apiFetch<{ exams: Exam[] }>("/api/exams").catch(() => ({ exams: [] as Exam[] })),
    apiFetch<Analytics>("/api/analytics").catch(() => null),
    apiFetch<{ sessions: FocusSession[] }>("/api/focus-session").catch(() => ({ sessions: [] as FocusSession[] })),
  ]);

  cachedData = {
    todos: todosRes.todos ?? [],
    exams: examsRes.exams ?? [],
    analytics: analyticsRes,
    focusSessions: sessionsRes.sessions ?? [],
    fetchedAt: now,
  };

  return cachedData;
}

function computeNotifications(data: CachedData): SmartNotification[] {
  const notifications: SmartNotification[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Overdue tasks
  data.todos
    .filter((t) => {
      if (t.status === "completed" || !t.dueDate) return false;
      const d = new Date(t.dueDate);
      d.setHours(0, 0, 0, 0);
      return d < today;
    })
    .forEach((t) => {
      const dueDate = new Date(t.dueDate!);
      dueDate.setHours(0, 0, 0, 0);
      const daysPast = Math.round((today.getTime() - dueDate.getTime()) / 86_400_000);
      notifications.push({
        id: `overdue-${t.id}`,
        kind: "overdue",
        message: `⚠️ ${t.title} is overdue!`,
        relativeTime: daysPast === 1 ? "1 day ago" : `${daysPast} days ago`,
        navigateTo: "todos",
        read: false,
      });
    });

  // Upcoming exams within 7 days
  data.exams
    .filter((e) => {
      const examDate = new Date(e.date);
      examDate.setHours(0, 0, 0, 0);
      const diff = Math.round((examDate.getTime() - today.getTime()) / 86_400_000);
      return diff >= 0 && diff <= 7;
    })
    .forEach((e) => {
      const examDate = new Date(e.date);
      examDate.setHours(0, 0, 0, 0);
      const days = Math.round((examDate.getTime() - today.getTime()) / 86_400_000);
      notifications.push({
        id: `exam-${e.id}`,
        kind: "exam",
        message: `📚 ${e.examName} in ${days} day${days === 1 ? "" : "s"}`,
        relativeTime: days === 0 ? "Today" : days === 1 ? "Tomorrow" : `in ${days} days`,
        navigateTo: "exams",
        read: false,
      });
    });

  // Study goal reminder
  if (data.analytics) {
    const focusTodayMinutes = data.analytics.stats.focusTodayMinutes;
    const targetMinutes = (data.analytics.stats.targetHours * 60) / 2;
    if (focusTodayMinutes < targetMinutes) {
      notifications.push({
        id: "goal-reminder",
        kind: "goal",
        message: "🎯 You're behind on your study goal today",
        relativeTime: "Today",
        navigateTo: "dashboard",
        read: false,
      });
    }
  }

  return notifications;
}

const KIND_CONFIG: Record<
  NotificationKind,
  { icon: typeof AlertTriangle; colorClass: string; bgClass: string; dotClass: string }
> = {
  overdue: {
    icon: AlertTriangle,
    colorClass: "text-rose-600 dark:text-rose-400",
    bgClass: "bg-rose-500/10 hover:bg-rose-500/15",
    dotClass: "bg-rose-500",
  },
  exam: {
    icon: BookOpen,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10 hover:bg-amber-500/15",
    dotClass: "bg-amber-500",
  },
  goal: {
    icon: Target,
    colorClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-500/10 hover:bg-violet-500/15",
    dotClass: "bg-violet-500",
  },
};

/* -------------------------------------------------------------------------- */
/*  View titles                                                                */
/* -------------------------------------------------------------------------- */

const VIEW_TITLES: Record<AppView, { title: string; subtitle: string }> = {
  landing: { title: "StudySpark", subtitle: "Premium student analytics" },
  login: { title: "Welcome back", subtitle: "Sign in to your account" },
  signup: { title: "Get started", subtitle: "Create your free account" },
  dashboard: { title: "Dashboard", subtitle: "Your study overview at a glance" },
  profile: { title: "Profile", subtitle: "Your personal information" },
  analytics: { title: "Analytics", subtitle: "Deep insights into your study habits" },
  todos: { title: "Daily Tasks", subtitle: "Plan and track your tasks" },
  calendar: { title: "Calendar", subtitle: "Your events and schedule" },
  subjects: { title: "Subjects", subtitle: "Manage your courses" },
  exams: { title: "Upcoming Exams", subtitle: "Stay ahead of your exams" },
  focus: { title: "Focus Timer", subtitle: "Pomodoro focus sessions" },
  planner: { title: "Study Planner", subtitle: "Plan your weekly study sessions" },
  settings: { title: "Settings", subtitle: "Customize your experience" },
};

/* -------------------------------------------------------------------------- */
/*  Notification Popover                                                       */
/* -------------------------------------------------------------------------- */

function NotificationPopover({
  buttonClassName,
  showLabel = false,
}: {
  buttonClassName?: string;
  showLabel?: boolean;
}) {
  const setView = useAppStore((s) => s.setView);
  const user = useAppStore((s) => s.user);
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchNotificationData();
      const computed = computeNotifications(data);
      // Preserve read state from current state
      setNotifications((prev) =>
        computed.map((n) => {
          const existing = prev.find((p) => p.id === n.id);
          return existing ? { ...n, read: existing.read } : n;
        })
      );
    } catch {
      // Silently fail — notifications are non-critical
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && open) {
      loadNotifications();
    }
  }, [user, open, loadNotifications]);

  // Initial load when user logs in
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);

  const handleNotificationClick = (notification: SmartNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    );
    setView(notification.navigateTo);
    setOpen(false);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size={showLabel ? "sm" : "icon"}
          className={cn(
            "relative rounded-xl",
            showLabel ? "h-11 justify-start gap-3 px-3" : "h-9 w-9",
            buttonClassName
          )}
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          {showLabel && <span>Notifications</span>}
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] font-bold text-white shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 rounded-2xl border-border/60 bg-background/80 p-0 shadow-2xl backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">Notifications</h4>
            {unreadCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-500/15 px-1.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[11px] font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Body */}
        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              <p className="text-xs text-muted-foreground">Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="mb-3 text-3xl"
              >
                🎉
              </motion.div>
              <p className="text-sm font-medium text-foreground">All caught up!</p>
              <p className="mt-1 text-xs text-muted-foreground">
                No pending notifications right now.
              </p>
            </div>
          ) : (
            <div className="py-1">
              <AnimatePresence initial={false}>
                {notifications.map((notification) => {
                  const config = KIND_CONFIG[notification.kind];
                  const Icon = config.icon;
                  return (
                    <motion.button
                      key={notification.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                        notification.read ? "opacity-50" : config.bgClass
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                          config.bgClass
                        )}
                      >
                        <Icon className={cn("h-4 w-4", config.colorClass)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm leading-snug",
                            notification.read
                              ? "text-muted-foreground"
                              : "text-foreground font-medium"
                          )}
                        >
                          {notification.message}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {notification.relativeTime}
                        </p>
                      </div>
                      {!notification.read && (
                        <span
                          className={cn(
                            "mt-2 h-2 w-2 shrink-0 rounded-full",
                            config.dotClass
                          )}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

/* -------------------------------------------------------------------------- */
/*  Topbar                                                                     */
/* -------------------------------------------------------------------------- */

export function Topbar({ onOpenPalette }: { onOpenPalette?: () => void }) {
  const { currentView, setMobileSidebarOpen, user } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [calcOpen, setCalcOpen] = useState(false);
  const [desktopRadioOpen, setDesktopRadioOpen] = useState(false);
  const [mobileRadioOpen, setMobileRadioOpen] = useState(false);
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);

  const meta = VIEW_TITLES[currentView] ?? VIEW_TITLES.dashboard;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const requestAppInstall = () => {
    window.dispatchEvent(new Event(PWA_INSTALL_REQUEST_EVENT));
    setMobileActionsOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl lg:px-6">
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Title */}
      <motion.div
        key={currentView}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="min-w-0 flex-1"
      >
        <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
          {meta.title}
        </h1>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">
          {meta.subtitle}
        </p>
      </motion.div>

      {/* Search — opens command palette */}
      <button
        type="button"
        onClick={onOpenPalette}
        className="group relative hidden h-9 w-44 items-center gap-2 rounded-xl border border-transparent bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground md:flex lg:w-56"
        aria-label="Open command palette"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="pointer-events-none hidden select-none items-center gap-1 rounded border bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground group-hover:border-border/60 lg:flex">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>
      {/* Mobile search icon button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-xl md:hidden"
        onClick={onOpenPalette}
        aria-label="Open command palette"
      >
        <Search className="h-[18px] w-[18px]" />
      </Button>

      {/* Study Radio popover */}
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="hidden md:inline-block">
              <Popover open={desktopRadioOpen} onOpenChange={setDesktopRadioOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "relative h-9 w-9 rounded-xl transition-colors",
                      (desktopRadioOpen || isRadioPlaying) && "bg-violet-500/10 text-violet-500"
                    )}
                    aria-label="Study Radio"
                  >
                    <Music className="h-[18px] w-[18px]" />
                    {isRadioPlaying && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-violet-500 animate-pulse ring-2 ring-background" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  sideOffset={8}
                  className="w-[360px] p-0 border-border/60 shadow-2xl bg-background/80 backdrop-blur-xl rounded-2xl overflow-hidden"
                >
                  <div className="p-1">
                    <LofiPlayer onPlayingChange={setIsRadioPlaying} />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-[220px] text-center text-xs">
            You can add your favorite music from YouTube here! Just paste the URL and play.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Calculator toggle */}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCalcOpen(true)}
              className="relative hidden h-9 w-9 rounded-xl md:inline-flex"
              aria-label="Open calculator"
            >
              <CalculatorIcon className="h-[18px] w-[18px]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Calculator</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Theme toggle */}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="relative hidden h-9 w-9 rounded-xl md:inline-flex"
              aria-label="Toggle theme"
            >
              <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle theme</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Notifications — smart popover */}
      <div className="hidden md:block">
        <NotificationPopover />
      </div>

      {/* Mobile utility actions */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "relative h-9 w-9 rounded-xl md:hidden",
          mobileActionsOpen && "bg-violet-500/10 text-violet-500"
        )}
        onClick={() => setMobileActionsOpen((open) => !open)}
        aria-label="Open dashboard options"
        aria-expanded={mobileActionsOpen}
      >
        <SlidersHorizontal className="h-[18px] w-[18px]" />
        {isRadioPlaying && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-background" />
        )}
      </Button>

      <AnimatePresence>
        {mobileActionsOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute left-3 right-3 top-full mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-border/60 bg-background/95 p-2 shadow-2xl backdrop-blur-xl md:hidden"
          >
            <Popover open={mobileRadioOpen} onOpenChange={setMobileRadioOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "relative h-11 justify-start gap-3 rounded-xl px-3",
                    (mobileRadioOpen || isRadioPlaying) && "bg-violet-500/10 text-violet-500"
                  )}
                  aria-label="Study Radio"
                >
                  <Music className="h-[18px] w-[18px]" />
                  <span>Music</span>
                  {isRadioPlaying && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                sideOffset={12}
                className="w-[calc(100vw-2rem)] max-w-[360px] overflow-hidden rounded-2xl border-border/60 bg-background/90 p-0 shadow-2xl backdrop-blur-xl"
              >
                <div className="p-1">
                  <LofiPlayer onPlayingChange={setIsRadioPlaying} />
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCalcOpen(true);
                setMobileActionsOpen(false);
              }}
              className="h-11 justify-start gap-3 rounded-xl px-3"
              aria-label="Open calculator"
            >
              <CalculatorIcon className="h-[18px] w-[18px]" />
              <span>Calculator</span>
            </Button>

            <NotificationPopover showLabel buttonClassName="w-full rounded-xl" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                toggleTheme();
                setMobileActionsOpen(false);
              }}
              className="h-11 justify-start gap-3 rounded-xl px-3"
              aria-label="Toggle theme"
            >
              <span className="relative h-[18px] w-[18px]">
                <Sun className="absolute h-[18px] w-[18px] rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
              </span>
              <span>Theme</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={requestAppInstall}
              className="col-span-2 h-11 justify-start gap-3 rounded-xl px-3"
              aria-label="Install StudySpark app"
            >
              <Download className="h-[18px] w-[18px]" />
              <span>Install App</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User chip (mobile shows avatar only) */}
      {user && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => useAppStore.getState().setView("profile")}
                className="group flex items-center gap-2 rounded-xl px-1 py-1 transition-colors hover:bg-accent/60"
              >
                <div className="relative h-8 w-8 shrink-0">
                  <Avatar className="h-full w-full rounded-lg shadow-sm ring-2 ring-transparent transition-all group-hover:ring-violet-500/30">
                    {user.avatar && (
                      <AvatarImage src={user.avatar} alt={user.username} className="object-cover" />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs font-semibold rounded-lg">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background z-10" />
                </div>
                <span className="hidden text-sm font-medium sm:block max-w-[120px] truncate">
                  {user.username}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end" className="max-w-[220px]">
              <p className="font-medium">{user.username}</p>
              <p className="text-[10px] text-muted-foreground">Click to view profile</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <CalculatorWidget open={calcOpen} onOpenChange={setCalcOpen} />
    </header>
  );
}
