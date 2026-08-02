"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  Sparkles,
  User,
} from "lucide-react";
import { useAppStore, type AppView } from "@/lib/store";
import { cn } from "@/lib/utils";

interface MobileDockItem {
  view: AppView;
  label: string;
  icon: typeof LayoutDashboard;
  isAi?: boolean;
}

const DOCK_ITEMS: MobileDockItem[] = [
  { view: "dashboard", label: "Home", icon: LayoutDashboard },
  { view: "todos", label: "Tasks", icon: CheckSquare },
  { view: "studySearch", label: "Sparks AI", icon: Sparkles, isAi: true },
  { view: "focus", label: "Focus", icon: Timer },
  { view: "profile", label: "Profile", icon: User },
];

export function MobileBottomNav() {
  const currentView = useAppStore((s) => s.currentView);
  const setView = useAppStore((s) => s.setView);

  const handleTabClick = (view: AppView) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        // ignore
      }
    }
    setView(view);
  };

  return (
    <div className="fixed bottom-4 inset-x-4 z-30 lg:hidden max-w-sm mx-auto pointer-events-auto pb-[env(safe-area-inset-bottom)]">
      <nav
        aria-label="Mobile Navigation Dock"
        className={cn(
          "relative flex items-center justify-between rounded-full px-3 py-2",
          // Authentic iPhone Glassmorphism Styling
          "bg-slate-900/75 dark:bg-slate-950/80 backdrop-blur-3xl",
          "border border-white/20 dark:border-white/15",
          "shadow-[0_12px_40px_rgba(0,0,0,0.45)]",
          // Ambient top specular light reflect line
          "before:pointer-events-none before:absolute before:inset-x-8 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent"
        )}
      >
        {DOCK_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;

          if (item.isAi) {
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => handleTabClick(item.view)}
                className="relative flex flex-col items-center justify-center py-0.5 px-2 transition-transform active:scale-90 group"
                aria-label="Open Sparks AI"
              >
                <div
                  className={cn(
                    "relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 shadow-lg",
                    isActive
                      ? "bg-gradient-to-tr from-cyan-400 via-teal-400 to-emerald-400 text-slate-950 shadow-cyan-500/40 scale-105 ring-2 ring-cyan-300/80"
                      : "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30"
                  )}
                >
                  <Sparkles className="h-5 w-5 animate-pulse fill-cyan-300/30" />
                  {/* Glowing halo indicator */}
                  <span className="absolute -inset-1 rounded-full bg-cyan-400/30 blur-md opacity-70 animate-pulse" />
                </div>
                <span
                  className={cn(
                    "mt-1 text-[9px] font-black tracking-wider uppercase transition-colors leading-none",
                    isActive ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" : "text-cyan-400/80"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.view}
              type="button"
              onClick={() => handleTabClick(item.view)}
              className="relative flex flex-1 flex-col items-center justify-center py-0.5 px-1 transition-transform active:scale-90"
              aria-label={`Go to ${item.label}`}
            >
              <div className="relative flex items-center justify-center h-8 w-8">
                {isActive && (
                  <motion.div
                    layoutId="mobile-dock-active-pill"
                    className="absolute inset-0 rounded-full bg-white/20 dark:bg-white/15 backdrop-blur-md shadow-inner"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <Icon
                  className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isActive
                      ? "text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                />
              </div>
              <span
                className={cn(
                  "mt-1 text-[9.5px] font-medium transition-colors leading-none truncate max-w-[50px]",
                  isActive
                    ? "font-bold text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]"
                    : "text-slate-400"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
