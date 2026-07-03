"use client";

import { useEffect, useState, useCallback } from "react";
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
  Sun,
  Moon,
  Plus,
  Play,
  Search,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAppStore, type AppView } from "@/lib/store";
import { toast } from "sonner";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";

interface CommandAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { setView, isAuthenticated } = useAppStore();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    toast.success(`Switched to ${theme === "dark" ? "light" : "dark"} mode`);
  };

  const goTo = (view: AppView) => {
    setView(view);
    setOpen(false);
  };

  const goToWithToast = (view: AppView, message: string) => {
    setView(view);
    setOpen(false);
    setTimeout(() => toast.info(message), 300);
  };

  const commands: CommandAction[] = [
    // Navigation
    {
      id: "nav-dashboard",
      label: "Go to Dashboard",
      icon: LayoutDashboard,
      group: "Navigation",
      shortcut: "⌘1",
      action: () => goTo("dashboard"),
    },
    {
      id: "nav-todos",
      label: "Go to Daily Tasks",
      icon: CheckSquare,
      group: "Navigation",
      shortcut: "⌘2",
      action: () => goTo("todos"),
    },
    {
      id: "nav-calendar",
      label: "Go to Calendar",
      icon: Calendar,
      group: "Navigation",
      shortcut: "⌘3",
      action: () => goTo("calendar"),
    },
    {
      id: "nav-subjects",
      label: "Go to Subjects",
      icon: BookOpen,
      group: "Navigation",
      shortcut: "⌘4",
      action: () => goTo("subjects"),
    },
    {
      id: "nav-exams",
      label: "Go to Upcoming Exams",
      icon: GraduationCap,
      group: "Navigation",
      shortcut: "⌘5",
      action: () => goTo("exams"),
    },
    {
      id: "nav-focus",
      label: "Go to Focus Timer",
      icon: Timer,
      group: "Navigation",
      shortcut: "⌘6",
      action: () => goTo("focus"),
    },
    {
      id: "nav-analytics",
      label: "Go to Analytics",
      icon: BarChart3,
      group: "Navigation",
      shortcut: "⌘7",
      action: () => goTo("analytics"),
    },
    {
      id: "nav-profile",
      label: "Go to Profile",
      icon: User,
      group: "Navigation",
      shortcut: "⌘8",
      action: () => goTo("profile"),
    },
    {
      id: "nav-settings",
      label: "Go to Settings",
      icon: Settings,
      group: "Navigation",
      shortcut: "⌘9",
      action: () => goTo("settings"),
    },
    // Actions
    {
      id: "action-theme",
      label: "Toggle Dark Mode",
      icon: theme === "dark" ? Sun : Moon,
      group: "Actions",
      action: toggleTheme,
    },
    {
      id: "action-add-task",
      label: "Add New Task",
      icon: Plus,
      group: "Actions",
      action: () => goToWithToast("todos", "Create a new task in the Tasks page"),
    },
    {
      id: "action-start-focus",
      label: "Start Focus Session",
      icon: Play,
      group: "Actions",
      action: () => goTo("focus"),
    },
    {
      id: "action-add-subject",
      label: "Add New Subject",
      icon: Plus,
      group: "Actions",
      action: () => goToWithToast("subjects", "Add a subject in the Subjects page"),
    },
    {
      id: "action-add-exam",
      label: "Add New Exam",
      icon: Plus,
      group: "Actions",
      action: () => goToWithToast("exams", "Add an exam in the Exams page"),
    },
  ];

  // Keyboard shortcut: Cmd+K / Ctrl+K
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    },
    []
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Number shortcuts (Cmd+1 through Cmd+9) — only when palette is closed
  useEffect(() => {
    if (open) return;
    const handleNumberKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const num = parseInt(e.key);
      if (num < 1 || num > 9) return;
      e.preventDefault();
      const navCommands = commands.filter((c) => c.group === "Navigation");
      if (navCommands[num - 1]) {
        navCommands[num - 1].action();
      }
    };
    document.addEventListener("keydown", handleNumberKey);
    return () => document.removeEventListener("keydown", handleNumberKey);
  }, [open, commands]);

  // Only render when authenticated
  if (!isAuthenticated) return null;

  const groups = [...new Set(commands.map((c) => c.group))];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2"
          >
            <Command
              className="glass-strong rounded-2xl border border-border/40 shadow-2xl shadow-violet-500/10 [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]]:h-12 [&_[cmdk-input-wrapper]]:border-b-violet-500/20 [&_[cmdk-input-wrapper]_svg]:text-violet-500 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]]:rounded-xl [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4 [&_[data-selected=true]]:bg-violet-500/10 [&_[data-selected=true]]:text-violet-700 dark:[&_[data-selected=true]]:text-violet-300"
            >
              <div className="flex items-center border-b border-violet-500/20 px-4">
                <Search className="h-4 w-4 shrink-0 text-violet-500" />
                <Command.Input
                  placeholder="Type a command or search..."
                  className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                />
                <kbd className="ml-2 hidden rounded-md border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
                  Esc
                </kbd>
              </div>

              <Command.List className="max-h-[320px] overflow-y-auto scrollbar-thin p-1">
                <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                  No results found.
                </Command.Empty>

                {groups.map((group) => (
                  <Command.Group
                    key={group}
                    heading={group}
                    className="pb-1"
                  >
                    {commands
                      .filter((c) => c.group === group)
                      .map((cmd) => {
                        const Icon = cmd.icon;
                        return (
                          <Command.Item
                            key={cmd.id}
                            onSelect={cmd.action}
                            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <span className="flex-1 font-medium">{cmd.label}</span>
                            {cmd.shortcut && (
                              <CommandShortcut className="text-[10px] font-medium">
                                {cmd.shortcut}
                              </CommandShortcut>
                            )}
                          </Command.Item>
                        );
                      })}
                    <CommandSeparator className="my-1" />
                  </Command.Group>
                ))}
              </Command.List>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border/40 px-3 py-2 text-[10px] text-muted-foreground">
                <span>↑↓ Navigate · ↵ Select</span>
                <span>⌘K to toggle</span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
