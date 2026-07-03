"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Lock,
  Sparkles,
  TrendingUp,
  Flame,
  Clock,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Target,
  RefreshCw,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore, type AppView } from "@/lib/store";
import { apiFetch, handleError } from "@/lib/api";
import {
  GlassCard,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/motion";
import { Skeleton, EmptyState } from "@/components/shared/feedback";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAchievementCelebration } from "@/hooks/use-achievement-celebration";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type Tier = "bronze" | "silver" | "gold" | "platinum";
type Category = "tasks" | "focus" | "streak" | "subjects" | "exams" | "special";

interface Badge {
  id: string;
  title: string;
  description: string;
  tier: Tier;
  icon: string;
  category: Category;
  earned: boolean;
}

interface TierStat {
  tier: Tier;
  earned: number;
  total: number;
}

interface AchievementsData {
  badges: Badge[];
  stats: {
    earnedCount: number;
    totalCount: number;
    completionPct: number;
    tierStats: TierStat[];
    recentBadges: string[];
  };
  progress: { id: string; current: number; target: number }[];
  summary: {
    totalTasks: number;
    completedTasks: number;
    totalFocusHours: number;
    focusSessions: number;
    streak: number;
    subjects: number;
    exams: number;
  };
}

/* -------------------------------------------------------------------------- */
/*  Config                                                                     */
/* -------------------------------------------------------------------------- */

const TIER_CONFIG: Record<
  Tier,
  {
    label: string;
    gradient: string;
    ring: string;
    glow: string;
    chipBg: string;
    chipText: string;
    border: string;
    shadow: string;
    /** Subtle tinted background for earned badge cards */
    tintBg: string;
    /** Decorative top stripe gradient */
    stripe: string;
  }
> = {
  bronze: {
    label: "Bronze",
    gradient: "from-amber-600 to-orange-700",
    ring: "ring-amber-500/40",
    glow: "bg-amber-500/30",
    chipBg: "bg-amber-500/15",
    chipText: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
    shadow: "shadow-amber-500/20",
    tintBg: "bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent",
    stripe: "from-amber-500 to-orange-600",
  },
  silver: {
    label: "Silver",
    gradient: "from-slate-400 to-slate-600",
    ring: "ring-slate-400/40",
    glow: "bg-slate-400/30",
    chipBg: "bg-slate-400/15",
    chipText: "text-slate-600 dark:text-slate-300",
    border: "border-slate-400/30",
    shadow: "shadow-slate-400/20",
    tintBg: "bg-gradient-to-br from-slate-400/10 via-slate-300/5 to-transparent",
    stripe: "from-slate-300 to-slate-500",
  },
  gold: {
    label: "Gold",
    gradient: "from-yellow-400 to-amber-500",
    ring: "ring-yellow-400/40",
    glow: "bg-yellow-400/30",
    chipBg: "bg-yellow-400/15",
    chipText: "text-yellow-600 dark:text-yellow-400",
    border: "border-yellow-400/30",
    shadow: "shadow-yellow-400/20",
    tintBg: "bg-gradient-to-br from-yellow-400/10 via-amber-500/5 to-transparent",
    stripe: "from-yellow-400 to-amber-500",
  },
  platinum: {
    label: "Platinum",
    gradient: "from-cyan-300 via-violet-400 to-fuchsia-400",
    ring: "ring-cyan-300/40",
    glow: "bg-cyan-300/30",
    chipBg: "bg-cyan-300/15",
    chipText: "text-cyan-600 dark:text-cyan-300",
    border: "border-cyan-300/30",
    shadow: "shadow-cyan-300/20",
    tintBg: "bg-gradient-to-br from-cyan-300/10 via-fuchsia-400/5 to-transparent",
    stripe: "from-cyan-300 via-violet-400 to-fuchsia-400",
  },
};

const CATEGORY_LABELS: Record<Category, string> = {
  tasks: "Tasks",
  focus: "Focus",
  streak: "Streak",
  subjects: "Subjects",
  exams: "Exams",
  special: "Special",
};

const SUMMARY_CARDS: {
  key: keyof AchievementsData["summary"];
  label: string;
  icon: typeof Trophy;
  gradient: string;
  suffix?: string;
}[] = [
  { key: "completedTasks", label: "Tasks Done", icon: CheckCircle2, gradient: "from-violet-500 to-fuchsia-500" },
  { key: "totalFocusHours", label: "Focus Hours", icon: Clock, gradient: "from-emerald-500 to-teal-500", suffix: "h" },
  { key: "focusSessions", label: "Sessions", icon: Target, gradient: "from-amber-500 to-orange-500" },
  { key: "streak", label: "Day Streak", icon: Flame, gradient: "from-rose-500 to-pink-500" },
  { key: "subjects", label: "Subjects", icon: BookOpen, gradient: "from-cyan-500 to-blue-500" },
  { key: "exams", label: "Exams", icon: GraduationCap, gradient: "from-violet-500 to-purple-500" },
];

/* -------------------------------------------------------------------------- */
/*  Components                                                                 */
/* -------------------------------------------------------------------------- */

function BadgeCard({ badge, index }: { badge: Badge; index: number }) {
  const tier = TIER_CONFIG[badge.tier];
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 18, scale: 0.95 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: index * 0.03 },
        },
      }}
      whileHover={{ y: -6, scale: 1.03 }}
      className={cn(
        "group relative flex flex-col items-center overflow-hidden rounded-3xl border p-5 text-center transition-colors",
        badge.earned
          ? cn("backdrop-blur-xl", tier.border, tier.tintBg)
          : "border-border/40 bg-muted/30"
      )}
    >
      {/* Decorative tier stripe at the top of earned badges */}
      {badge.earned && (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
            tier.stripe
          )}
          aria-hidden="true"
        />
      )}

      {/* Glow background when earned */}
      {badge.earned && (
        <div
          className={cn(
            "pointer-events-none absolute -top-1/2 left-1/2 h-full w-full -translate-x-1/2 rounded-full opacity-50 blur-2xl",
            tier.glow
          )}
        />
      )}

      {/* Tier ribbon */}
      <span
        className={cn(
          "absolute right-2 top-2 z-10 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
          tier.chipBg,
          tier.chipText
        )}
      >
        {tier.label}
      </span>

      {/* Icon medallion */}
      <div className="relative z-[1] mb-3">
        {badge.earned ? (
          <motion.div
            initial={{ rotate: -20, scale: 0.6 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: index * 0.03 + 0.1 }}
            className={cn(
              "relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br shadow-lg",
              tier.gradient,
              tier.shadow
            )}
          >
            <span className="text-3xl drop-shadow-sm">{badge.icon}</span>
            {/* Periodic shine sweep — runs every 4s */}
            <span className="badge-shine" aria-hidden="true" />
          </motion.div>
        ) : (
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/60">
            <Lock className="h-6 w-6 text-muted-foreground/60" />
            <span className="absolute text-3xl opacity-20 grayscale">{badge.icon}</span>
          </div>
        )}
      </div>

      <h3
        className={cn(
          "relative z-[1] text-sm font-semibold leading-tight",
          badge.earned ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {badge.title}
      </h3>
      <p
        className={cn(
          "relative z-[1] mt-1 text-[11px] leading-snug",
          badge.earned ? "text-muted-foreground" : "text-muted-foreground/70"
        )}
      >
        {badge.description}
      </p>

      {/* Category pill */}
      <span className="relative z-[1] mt-3 rounded-full bg-muted/60 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
        {CATEGORY_LABELS[badge.category]}
      </span>
    </motion.div>
  );
}

function TierStatCard({ stat, delay }: { stat: TierStat; delay: number }) {
  const tier = TIER_CONFIG[stat.tier];
  const pct = stat.total > 0 ? Math.round((stat.earned / stat.total) * 100) : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn("glass rounded-2xl p-4 ring-1", tier.ring)}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "bg-gradient-to-br bg-clip-text text-sm font-bold text-transparent",
            tier.gradient
          )}
        >
          {tier.label}
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          {stat.earned}/{stat.total}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: delay + 0.2, ease: "easeOut" }}
          className={cn("h-full rounded-full bg-gradient-to-r", tier.gradient)}
        />
      </div>
    </motion.div>
  );
}

function ProgressMilestone({
  progress,
  badge,
}: {
  progress: { id: string; current: number; target: number };
  badge: Badge | undefined;
}) {
  if (!badge) return null;
  const pct = Math.min(100, Math.round((progress.current / progress.target) * 100));
  const tier = TIER_CONFIG[badge.tier];
  const isDone = badge.earned;
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl",
            isDone ? cn("bg-gradient-to-br shadow-md", tier.gradient, tier.shadow) : "bg-muted/60"
          )}
        >
          {isDone ? badge.icon : <Lock className="h-4 w-4 text-muted-foreground/60" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">{badge.title}</p>
            <span className="shrink-0 text-xs font-medium text-muted-foreground">
              {progress.current}/{progress.target}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                isDone
                  ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                  : "bg-gradient-to-r from-violet-500 to-fuchsia-500"
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main page                                                                  */
/* -------------------------------------------------------------------------- */

export function AchievementsPage() {
  const setView = useAppStore((s) => s.setView);
  const [data, setData] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Category | "all" | "earned" | "locked">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<AchievementsData>("/api/achievements");
      setData(res);
    } catch (err) {
      handleError(err, "Failed to load achievements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Confetti celebration when new badges are earned in-session
  useAchievementCelebration({
    badges: data?.badges,
    enabled: !loading,
  });

  const filteredBadges = useMemo(() => {
    if (!data) return [];
    switch (filter) {
      case "earned":
        return data.badges.filter((b) => b.earned);
      case "locked":
        return data.badges.filter((b) => !b.earned);
      case "all":
        return data.badges;
      default:
        return data.badges.filter((b) => b.category === filter);
    }
  }, [data, filter]);

  const handleShare = () => {
    if (!data) return;
    const text = `I've earned ${data.stats.earnedCount}/${data.stats.totalCount} badges on StudySpark! 🏆`;
    if (navigator.share) {
      navigator
        .share({ title: "My StudySpark Achievements", text })
        .catch(() => {});
    } else {
      navigator.clipboard
        .writeText(text)
        .then(() => toast.success("Copied to clipboard!"))
        .catch(() => toast.error("Couldn't copy"));
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon={Trophy}
        title="No achievements data"
        description="We couldn't load your achievements. Please try again."
        action={
          <Button onClick={load} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        }
      />
    );
  }

  const { stats, summary } = data;
  const overallPct = stats.completionPct;

  const filterButtons: { key: typeof filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "earned", label: "Earned" },
    { key: "locked", label: "Locked" },
    { key: "tasks", label: "Tasks" },
    { key: "focus", label: "Focus" },
    { key: "streak", label: "Streak" },
    { key: "subjects", label: "Subjects" },
    { key: "exams", label: "Exams" },
    { key: "special", label: "Special" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero header card */}
      <GlassCard className="overflow-hidden">
        <div className="relative p-6 sm:p-8">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-fuchsia-500/15 blur-3xl" />

          <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 px-3 py-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                  <Sparkles className="h-3 w-3" />
                  Achievements
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {stats.earnedCount} of {stats.totalCount} unlocked
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Your Study Journey
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Earn badges by studying, completing tasks, and reaching milestones.
              </p>

              {/* Overall progress bar */}
              <div className="mt-5 max-w-md">
                <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                  <span className="text-muted-foreground">Overall completion</span>
                  <span className="text-foreground">{overallPct}%</span>
                </div>
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${overallPct}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400"
                  />
                </div>
              </div>

              {/* Tier stat cards */}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.tierStats.map((t, i) => (
                  <TierStatCard key={t.tier} stat={t} delay={0.1 * i} />
                ))}
              </div>
            </div>

            {/* Big trophy medallion */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto flex h-32 w-32 shrink-0 items-center justify-center sm:h-36 sm:w-36"
            >
              <div
                className={cn(
                  "float-y flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-400 shadow-2xl shadow-violet-500/40 sm:h-32 sm:w-32"
                )}
              >
                <Trophy className="h-12 w-12 text-white drop-shadow sm:h-14 sm:w-14" />
              </div>
              {/* Rotating sparkle ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="pointer-events-none absolute inset-0"
              >
                <Sparkles className="twinkle absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 text-amber-400" style={{ animationDelay: "0s" }} />
                <Sparkles className="twinkle absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 text-violet-400" style={{ animationDelay: "0.5s" }} />
                <Sparkles className="twinkle absolute -left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-fuchsia-400" style={{ animationDelay: "1s" }} />
                <Sparkles className="twinkle absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" style={{ animationDelay: "1.5s" }} />
              </motion.div>
            </motion.div>
          </div>

          {/* Share button */}
          <div className="relative z-[1] mt-6 flex justify-end">
            <Button onClick={handleShare} variant="outline" size="sm" className="gap-2 rounded-xl">
              <Share2 className="h-3.5 w-3.5" />
              Share progress
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Summary stat cards */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Your stats
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SUMMARY_CARDS.map((card, i) => {
            const Icon = card.icon;
            const value = summary[card.key];
            return (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="glass rounded-2xl p-4"
              >
                <div
                  className={cn(
                    "mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                    card.gradient
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-2xl font-bold leading-none">
                  {value}
                  {card.suffix && (
                    <span className="text-sm font-semibold text-muted-foreground">
                      {card.suffix}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* In-progress milestones */}
      {data.progress.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-violet-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Milestone progress
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.progress.map((p) => {
              const badge = data.badges.find((b) => b.id === p.id);
              return <ProgressMilestone key={p.id} progress={p} badge={badge} />;
            })}
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {filterButtons.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
              filter === f.key
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/25"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Badges grid */}
      {filteredBadges.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No badges here yet"
          description="Try a different filter or start studying to unlock badges!"
          action={
            <Button
              onClick={() => setView("focus" as AppView)}
              className="gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
            >
              Start a focus session
            </Button>
          }
        />
      ) : (
        <StaggerContainer className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filteredBadges.map((badge, i) => (
            <StaggerItem key={badge.id} className="h-full">
              <BadgeCard badge={badge} index={i} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* CTA at bottom */}
      {stats.earnedCount < stats.totalCount && (
        <GlassCard className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            You&apos;ve unlocked{" "}
            <span className="font-semibold text-foreground">{stats.earnedCount}</span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">{stats.totalCount}</span>{" "}
            badges. Keep studying to earn them all! 🚀
          </p>
        </GlassCard>
      )}
    </div>
  );
}
