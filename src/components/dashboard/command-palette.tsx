"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BookOpen,
  GraduationCap,
  Timer,
  BarChart3,
  User,
  Settings,
  Trophy,
  Sun,
  Moon,
  Search,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  Play,
  Sparkles,
  LogOut,
  CalendarRange,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAppStore, type AppView } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface CommandAction {
  id: string;
  label: string;
  subtitle?: string;
  icon: LucideIcon;
  group: "Navigate" | "Actions" | "Theme";
  keywords?: string;
  run: () => void;
  shortcut?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Increments each time the palette opens — used to remount inner content for fresh state. */
  sessionId: number;
}

export function CommandPalette({ open, onOpenChange, sessionId }: CommandPaletteProps) {
  return (
    <AnimatePresence>
      {open && (
        <PaletteBackdrop onOpenChange={onOpenChange} sessionId={sessionId} />
      )}
    </AnimatePresence>
  );
}

function PaletteBackdrop({
  onOpenChange,
  sessionId,
}: {
  onOpenChange: (open: boolean) => void;
  sessionId: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]"
      onClick={() => onOpenChange(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Palette — keyed so internal state resets each open */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -4 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border/60 bg-background/90 shadow-2xl backdrop-blur-2xl"
      >
        <PaletteInner key={sessionId} onOpenChange={onOpenChange} />
      </motion.div>
    </motion.div>
  );
}

function PaletteInner({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const { setView } = useAppStore();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const navigate = useCallback(
    (view: AppView) => {
      setView(view);
      onOpenChange(false);
    },
    [setView, onOpenChange]
  );

  const actions = useMemo<CommandAction[]>(
    () => [
      // Navigate
      { id: "nav-dashboard", label: "Dashboard", subtitle: "Overview & stats", icon: LayoutDashboard, group: "Navigate", keywords: "home overview", run: () => navigate("dashboard") },
      { id: "nav-todos", label: "Daily Tasks", subtitle: "Manage your tasks", icon: CheckSquare, group: "Navigate", keywords: "todo tasks kanban", run: () => navigate("todos") },
      { id: "nav-calendar", label: "Calendar", subtitle: "Events & schedule", icon: Calendar, group: "Navigate", keywords: "events schedule", run: () => navigate("calendar") },
      { id: "nav-planner", label: "Study Planner", subtitle: "Weekly study plan", icon: CalendarRange, group: "Navigate", keywords: "planner schedule weekly plan", run: () => navigate("planner") },
      { id: "nav-subjects", label: "Subjects", subtitle: "Your courses", icon: BookOpen, group: "Navigate", keywords: "courses classes", run: () => navigate("subjects") },
      { id: "nav-exams", label: "Upcoming Exams", subtitle: "Exam tracker", icon: GraduationCap, group: "Navigate", keywords: "test quiz", run: () => navigate("exams") },
      { id: "nav-focus", label: "Focus Timer", subtitle: "Pomodoro timer", icon: Timer, group: "Navigate", keywords: "pomodoro study timer", run: () => navigate("focus") },
      { id: "nav-analytics", label: "Analytics", subtitle: "Study insights", icon: BarChart3, group: "Navigate", keywords: "charts stats insights", run: () => navigate("analytics") },
      { id: "nav-profile", label: "Profile", subtitle: "Your profile", icon: User, group: "Navigate", keywords: "account me", run: () => navigate("profile") },
      { id: "nav-settings", label: "Settings", subtitle: "Preferences", icon: Settings, group: "Navigate", keywords: "preferences config", run: () => navigate("settings") },
      // Actions
      { id: "act-new-task", label: "Create new task", subtitle: "Jump to task board", icon: Plus, group: "Actions", keywords: "add todo create", run: () => navigate("todos"), shortcut: "N" },
      { id: "act-start-focus", label: "Start focus session", subtitle: "Begin a Pomodoro", icon: Play, group: "Actions", keywords: "pomodoro timer start", run: () => navigate("focus"), shortcut: "F" },
      { id: "act-seed", label: "Load demo data", subtitle: "Settings → Demo data", icon: Sparkles, group: "Actions", keywords: "seed demo sample", run: () => navigate("settings") },
      { id: "act-logout", label: "Log out", subtitle: "Sign out of your account", icon: LogOut, group: "Actions", keywords: "sign out exit", run: () => { onOpenChange(false); logout(); } },
      // Theme
      { id: "theme-toggle", label: "Toggle theme", subtitle: "Switch light / dark", icon: theme === "dark" ? Sun : Moon, group: "Theme", keywords: "light dark mode appearance", run: () => { setTheme(theme === "dark" ? "light" : "dark"); onOpenChange(false); } },
      { id: "theme-light", label: "Set light theme", icon: Sun, group: "Theme", keywords: "light mode day", run: () => { setTheme("light"); onOpenChange(false); } },
      { id: "theme-dark", label: "Set dark theme", icon: Moon, group: "Theme", keywords: "dark mode night", run: () => { setTheme("dark"); onOpenChange(false); } },
    ],
    [navigate, onOpenChange, theme, setTheme, logout]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.toLowerCase();
    return actions.filter((a) => {
      const haystack = `${a.label} ${a.subtitle ?? ""} ${a.keywords ?? ""} ${a.group}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query, actions]);

  // Group filtered actions preserving order
  const grouped = useMemo(() => {
    const groups: Record<string, CommandAction[]> = {};
    filtered.forEach((a) => {
      if (!groups[a.group]) groups[a.group] = [];
      groups[a.group].push(a);
    });
    return groups;
  }, [filtered]);

  const flatList = filtered;
  // Derive a clamped index — never store an out-of-bounds index
  const safeIndex = flatList.length === 0 ? 0 : Math.min(activeIndex, flatList.length - 1);

  // Focus input on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-cmd-idx="${safeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [safeIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (flatList.length === 0) return;
        setActiveIndex((i) => (i + 1) % flatList.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (flatList.length === 0) return;
        setActiveIndex((i) => (i - 1 + flatList.length) % flatList.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const action = flatList[safeIndex];
        if (action) action.run();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    },
    [flatList, safeIndex, onOpenChange]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Search header */}
      <div className="flex items-center gap-3 border-b border-border/50 px-4">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          placeholder="Search commands, pages, and actions..."
          className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          autoComplete="off"
          spellCheck={false}
        />
        <kbd className="hidden shrink-0 select-none rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
          ESC
        </kbd>
      </div>

      {/* Results */}
      <div ref={listRef} className="max-h-[min(60vh,420px)] overflow-y-auto scrollbar-thin p-2">
        {flatList.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
            <div className="text-3xl opacity-60">🔍</div>
            <p className="text-sm font-medium text-foreground">No results found</p>
            <p className="text-xs text-muted-foreground">
              Try a different search term.
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="mb-1 last:mb-0">
              <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group}
              </p>
              {items.map((action) => {
                const flatIdx = flatList.indexOf(action);
                const active = flatIdx === safeIndex;
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    data-cmd-idx={flatIdx}
                    onMouseMove={() => setActiveIndex(flatIdx)}
                    onClick={action.run}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                      active
                        ? "bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 text-foreground"
                        : "text-foreground/90 hover:bg-accent/60"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                        active
                          ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/25"
                          : "bg-muted/60 text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{action.label}</p>
                      {action.subtitle && (
                        <p className="truncate text-xs text-muted-foreground">
                          {action.subtitle}
                        </p>
                      )}
                    </div>
                    {action.shortcut && (
                      <kbd className="hidden shrink-0 select-none rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
                        {action.shortcut}
                      </kbd>
                    )}
                    {active && (
                      <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                    )}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-border/50 px-3 py-2 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="inline-flex h-4 w-4 items-center justify-center rounded border border-border bg-muted/60">
              <ArrowUp className="h-2.5 w-2.5" />
            </kbd>
            <kbd className="inline-flex h-4 w-4 items-center justify-center rounded border border-border bg-muted/60">
              <ArrowDown className="h-2.5 w-2.5" />
            </kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-border bg-muted/60 px-1 text-[9px]">
              ↵
            </kbd>
            select
          </span>
        </div>
        <span className="hidden items-center gap-1 sm:flex">
          <Sparkles className="h-3 w-3 text-violet-500" />
          StudySpark
        </span>
      </div>
    </>
  );
}
