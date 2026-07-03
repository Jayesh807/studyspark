"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  User,
  BarChart3,
  CheckSquare,
  Calendar,
  BookOpen,
  GraduationCap,
  Timer,
  Settings,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useAppStore, type AppView } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  view: AppView;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Overview & stats" },
  { view: "todos", label: "Daily Tasks", icon: CheckSquare, description: "Manage your tasks" },
  { view: "calendar", label: "Calendar", icon: Calendar, description: "Events & schedule" },
  { view: "subjects", label: "Subjects", icon: BookOpen, description: "Your courses" },
  { view: "exams", label: "Upcoming Exams", icon: GraduationCap, description: "Exam tracker" },
  { view: "focus", label: "Focus Timer", icon: Timer, description: "Pomodoro timer" },
  { view: "analytics", label: "Analytics", icon: BarChart3, description: "Study insights" },
  { view: "profile", label: "Profile", icon: User, description: "Your profile" },
  { view: "settings", label: "Settings", icon: Settings, description: "Preferences" },
];

function BrandLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <button
      onClick={() => useAppStore.getState().setView("dashboard")}
      className="flex items-center gap-2.5 w-full group"
    >
      <motion.div
        whileHover={{ rotate: 12, scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30"
      >
        <Sparkles className="h-5 w-5 text-white" />
        <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-400 opacity-0 blur-md transition-opacity group-hover:opacity-60" />
      </motion.div>
      {collapsed ? null : (
        <div className="flex flex-col items-start overflow-hidden">
          <span className="text-base font-bold leading-none tracking-tight text-gradient">
            StudySpark
          </span>
          <span className="text-[10px] font-medium text-muted-foreground leading-none mt-0.5">
            Student Analytics
          </span>
        </div>
      )}
    </button>
  );
}

function NavButton({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  const [sparkKey, setSparkKey] = useState(0);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(() => {
    setSparkKey((k) => k + 1);
    onClick();
  }, [onClick]);

  const button = (
    <motion.button
      ref={btnRef}
      onClick={handleClick}
      whileHover={{ x: collapsed ? 0 : 2 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors overflow-hidden",
        active
          ? "text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
      )}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/95 to-fuchsia-500/95 shadow-lg shadow-violet-500/35"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      {/* Mini spark flash on click */}
      {sparkKey > 0 && (
        <span
          key={sparkKey}
          className="mini-spark pointer-events-none absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/40"
        />
      )}
      <Icon
        className={cn(
          "relative z-10 h-[18px] w-[18px] shrink-0",
          active && "text-white"
        )}
      />
      {!collapsed && (
        <span className="relative z-10 truncate">{item.label}</span>
      )}
      {!collapsed && active && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-white"
        />
      )}
    </motion.button>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }
  return button;
}

export function Sidebar() {
  const {
    currentView,
    setView,
    sidebarOpen,
    setSidebarOpen,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    user,
  } = useAppStore();
  const { logout } = useAuth();
  const collapsed = !sidebarOpen;

  const handleLogout = () => {
    logout();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center px-4">
        <BrandLogo collapsed={collapsed} />
      </div>
      {/* Gradient separator line below brand */}
      <div className="h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-4">
        <TooltipProvider delayDuration={0}>
          <nav className="space-y-1">
            {!collapsed && (
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Menu
              </p>
            )}
            {NAV_ITEMS.map((item) => (
              <NavButton
                key={item.view}
                item={item}
                active={currentView === item.view}
                collapsed={collapsed}
                onClick={() => setView(item.view)}
              />
            ))}
          </nav>
        </TooltipProvider>
      </ScrollArea>

      {/* User card + logout */}
      <div className="border-t border-sidebar-border/60 p-3 space-y-2">
        {!collapsed && user ? (
          <div className="flex items-center gap-3 rounded-xl bg-accent/50 p-2.5">
            <Avatar className="h-9 w-9 ring-2 ring-violet-500/20">
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm font-semibold">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.username}</p>
              <p className="truncate text-[11px] text-muted-foreground">Student</p>
            </div>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLogout}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right">Logout</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 76 : 264 }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="hidden lg:flex flex-col shrink-0 border-r border-sidebar-border/60 bg-sidebar/80 backdrop-blur-xl relative z-20"
      >
        {sidebarContent}
        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-md hover:scale-110 transition-transform"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </motion.aside>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="fixed left-0 top-0 z-50 h-full w-[264px] bg-sidebar shadow-2xl lg:hidden"
            >
              {sidebarContent}
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
