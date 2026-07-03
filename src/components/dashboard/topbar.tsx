"use client";

import { motion } from "framer-motion";
import { Menu, Search, Bell, Sun, Moon, Command } from "lucide-react";
import { useTheme } from "next-themes";
import { useAppStore, type AppView } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  settings: { title: "Settings", subtitle: "Customize your experience" },
};

export function Topbar() {
  const { currentView, setMobileSidebarOpen, user, notifications } =
    useAppStore();
  const { theme, setTheme } = useTheme();

  const meta = VIEW_TITLES[currentView] ?? VIEW_TITLES.dashboard;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
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

      {/* Search (decorative on desktop) */}
      <div className="relative hidden md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search..."
          className="h-9 w-44 pl-9 pr-12 rounded-xl bg-muted/50 border-transparent focus-visible:bg-background lg:w-56"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:flex">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </div>

      {/* Theme toggle */}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="relative h-9 w-9 rounded-xl"
              aria-label="Toggle theme"
            >
              <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle theme</TooltipContent>
        </Tooltip>

        {/* Notifications */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-xl"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              {notifications && (
                <span className="absolute right-2 top-2 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* User chip (mobile shows avatar only) */}
      {user && (
        <button
          onClick={() => useAppStore.getState().setView("profile")}
          className="flex items-center gap-2 rounded-xl px-1 py-1 hover:bg-accent/60 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-semibold text-white shadow-sm">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <span className="hidden text-sm font-medium sm:block max-w-[100px] truncate">
            {user.username}
          </span>
        </button>
      )}
    </header>
  );
}
