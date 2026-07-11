"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Flame,
  Target,
  PieChart as PieIcon,
  Award,
  CheckCircle2,
  CalendarRange,
  GraduationCap,
  Layers,
  Gauge,
  Download,
  Sparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiFetch, handleError } from "@/lib/api";
import { Analytics, colorOf } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import {
  PageTransition,
  GlassCard,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/motion";
import { ContributionHeatmap } from "@/components/dashboard/contribution-heatmap";
import { Skeleton, EmptyState } from "@/components/shared/feedback";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Period = "weekly" | "monthly";

const CHART_PALETTE = [
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#f59e0b",
  "#22c55e",
  "#06b6d4",
];

// === Tooltip ===
interface TooltipPayloadItem {
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: { fill?: string; name?: string } & Record<string, unknown>;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  suffix?: string;
}

function ChartTooltip({ active, payload, label, suffix = "" }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs shadow-lg min-w-[120px]">
      {label !== undefined && label !== "" && (
        <p className="font-semibold mb-1">{label}</p>
      )}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5 text-muted-foreground">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: p.color || p.payload?.fill }}
          />
          {p.name}:{" "}
          <span className="font-medium text-foreground">
            {p.value}
            {suffix}
          </span>
        </p>
      ))}
    </div>
  );
}

export function AnalyticsPage() {
  const reduceMotion = useAppStore((s) => s.reduceMotion);
  const userId = useAppStore((s) => s.user?.id);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("weekly");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<Analytics>("/api/analytics");
      setData(res);
    } catch (err) {
      handleError(err, "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const studyHoursData = useMemo(() => {
    if (!data) return [];
    return period === "weekly" ? data.weeklyData : data.monthlyData;
  }, [data, period]);

  const avgAttendance = useMemo(() => {
    if (!data?.subjectPerformance?.length) return 0;
    const sum = data.subjectPerformance.reduce((s, x) => s + x.attendance, 0);
    return Math.round(sum / data.subjectPerformance.length);
  }, [data]);

  return (
    <PageTransition className="space-y-6">
      {/* === Header === */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-500/5 dark:bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-950 ring-1 ring-violet-500/20 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Insights to power your growth</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Analytics
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Deep-dive into your study patterns, exam readiness, and productivity trends.
          </p>
        </div>

        {/* Period toggle */}
        <div className="inline-flex items-center gap-1 rounded-2xl bg-muted/70 p-1 backdrop-blur w-fit">
          {(["weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "relative px-4 py-1.5 text-sm font-medium rounded-xl transition-colors capitalize",
                period === p ? "text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {period === p && (
                <motion.div
                  layoutId="analytics-period-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <CalendarRange className="h-3.5 w-3.5" />
                {p}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* === KPI row === */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <KpiCard
            icon={Clock}
            label="Total Focus Hours"
            value={data?.stats.totalFocusHours || 0}
            decimals={1}
            suffix="h"
            gradient="from-violet-500 to-purple-500"
            loading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            icon={TrendingUp}
            label="Weekly Focus Hours"
            value={data?.stats.weeklyFocusHours || 0}
            decimals={1}
            suffix="h"
            gradient="from-fuchsia-500 to-pink-500"
            loading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            icon={Gauge}
            label="Monthly Focus Hours"
            value={data?.stats.monthlyFocusHours || 0}
            decimals={1}
            suffix="h"
            gradient="from-rose-500 to-orange-500"
            loading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            icon={Flame}
            label="Study Streak"
            value={data?.stats.studyStreak || 0}
            suffix=" days"
            gradient="from-amber-500 to-yellow-500"
            loading={loading}
          />
        </StaggerItem>
      </StaggerContainer>

      {/* === Contribution heatmap === */}
      <StaggerContainer>
        <StaggerItem>
          <ContributionHeatmap />
        </StaggerItem>
      </StaggerContainer>

      {/* === Main charts grid === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Study Hours over time */}
        <StaggerContainer className="lg:col-span-2 space-y-6">
          <StaggerItem>
            <GlassCard className="p-5 sm:p-6">
              <ChartHeader
                icon={TrendingUp}
                title="Study Hours Over Time"
                subtitle={period === "weekly" ? "Last 7 days" : "Last 30 days"}
              />
              <div className="h-72 -mx-2 mt-4">
                {loading ? (
                  <Skeleton className="h-full w-full rounded-xl" />
                ) : studyHoursData.length === 0 ? (
                  <ChartEmpty />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={studyHoursData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="areaHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
                          <stop offset="60%" stopColor="#d946ef" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#d946ef" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="lineHours" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#d946ef" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        className="text-[10px] fill-muted-foreground"
                        interval={period === "monthly" ? 4 : 0}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        className="text-[10px] fill-muted-foreground"
                        width={28}
                      />
                      <Tooltip content={<ChartTooltip suffix="h" />} />
                      <Area
                        type="monotone"
                        dataKey="hours"
                        name="Hours"
                        stroke="url(#lineHours)"
                        strokeWidth={3}
                        fill="url(#areaHours)"
                        dot={false}
                        activeDot={{
                          r: 5,
                          fill: "#8b5cf6",
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                        animationDuration={reduceMotion ? 0 : 900}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </GlassCard>
          </StaggerItem>

          {/* Task completion trend */}
          <StaggerItem>
            <GlassCard className="p-5 sm:p-6">
              <ChartHeader
                icon={CheckCircle2}
                title="Tasks Completed (14 days)"
                subtitle="Daily completion trend"
              />
              <div className="h-64 -mx-2 mt-4">
                {loading ? (
                  <Skeleton className="h-full w-full rounded-xl" />
                ) : (data?.trendData?.length || 0) === 0 ? (
                  <ChartEmpty />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.trendData || []} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#ec4899" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        className="text-[10px] fill-muted-foreground"
                        interval={1}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        className="text-[10px] fill-muted-foreground"
                        width={28}
                        allowDecimals={false}
                      />
                      <Tooltip cursor={{ fill: "rgba(168,85,247,0.08)" }} content={<ChartTooltip />} />
                      <Bar
                        dataKey="completed"
                        name="Completed"
                        fill="url(#barTrend)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={28}
                        animationDuration={reduceMotion ? 0 : 900}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </GlassCard>
          </StaggerItem>

        </StaggerContainer>

        {/* Right column: distribution + exam progress */}
        <StaggerContainer className="space-y-6">
          {/* Focus distribution pie */}
          <StaggerItem>
            <GlassCard className="p-5 sm:p-6">
              <ChartHeader
                icon={PieIcon}
                title="Focus Time by Subject"
                subtitle="Hours distributed"
              />
              <div className="h-72 mt-4">
                {loading ? (
                  <Skeleton className="h-full w-full rounded-xl" />
                ) : (data?.focusBySubject?.length || 0) === 0 ? (
                  <ChartEmpty />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.focusBySubject || []}
                        dataKey="hours"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        animationDuration={reduceMotion ? 0 : 800}
                      >
                        {(data?.focusBySubject || []).map((entry, i) => (
                          <Cell
                            key={i}
                            fill={colorOf(entry.color).chart}
                            stroke="rgba(255,255,255,0.6)"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip suffix="h" />} />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </GlassCard>
          </StaggerItem>

          {/* Exam progress radial */}
          <StaggerItem>
            <GlassCard className="p-5 sm:p-6">
              <ChartHeader
                icon={Target}
                title="Exam Readiness"
                subtitle="Preparation progress"
              />
              <div className="h-64 mt-4">
                {loading ? (
                  <Skeleton className="h-full w-full rounded-xl" />
                ) : (data?.examProgress?.length || 0) === 0 ? (
                  <ChartEmpty />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="25%"
                      outerRadius="100%"
                      data={data?.examProgress || []}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                      <RadialBar
                        background={{ fill: "rgba(139,92,246,0.08)" }}
                        dataKey="progress"
                        cornerRadius={8}
                        animationDuration={reduceMotion ? 0 : 900}
                      >
                        {(data?.examProgress || []).map((_, i) => (
                          <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                        ))}
                      </RadialBar>
                      <Tooltip content={<ChartTooltip suffix="%" />} />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 10 }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </GlassCard>
          </StaggerItem>
        </StaggerContainer>
      </div>

      {/* === Subject Progress (full-width) === */}
      <StaggerContainer>
        <StaggerItem>
          <GlassCard className="p-5 sm:p-6">
            <ChartHeader
              icon={GraduationCap}
              title="Subject Progress"
              subtitle="Course completion by subject"
            />
            <div className="h-72 -mx-2 mt-4">
              {loading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : (data?.subjectPerformance?.length || 0) === 0 ? (
                <ChartEmpty />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={data?.subjectPerformance || []}
                    margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={false}
                      className="text-[10px] fill-muted-foreground"
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      className="text-[11px] fill-muted-foreground"
                      width={90}
                    />
                    <Tooltip cursor={{ fill: "rgba(139,92,246,0.08)" }} content={<ChartTooltip suffix="%" />} />
                    <Bar
                      dataKey="progress"
                      name="Progress"
                      radius={[0, 8, 8, 0]}
                      maxBarSize={24}
                      animationDuration={reduceMotion ? 0 : 900}
                    >
                      {(data?.subjectPerformance || []).map((entry, i) => (
                        <Cell key={i} fill={colorOf(entry.color).chart} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </GlassCard>
        </StaggerItem>
      </StaggerContainer>

      {/* === Secondary charts grid === */}
      <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks by category */}
        <StaggerItem>
          <GlassCard className="p-5 sm:p-6">
            <ChartHeader
              icon={Layers}
              title="Tasks by Category"
              subtitle="Completed vs total"
            />
            <div className="h-56 mt-4">
              {loading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : (data?.categoryStats?.length || 0) === 0 ? (
                <ChartEmpty />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data?.categoryStats || []}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                    <XAxis
                      dataKey="category"
                      tickLine={false}
                      axisLine={false}
                      className="text-[10px] fill-muted-foreground capitalize"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      className="text-[10px] fill-muted-foreground"
                      width={24}
                      allowDecimals={false}
                    />
                    <Tooltip cursor={{ fill: "rgba(139,92,246,0.08)" }} content={<ChartTooltip />} />
                    <Bar dataKey="total" name="Total" fill="#c4b5fd" radius={[4, 4, 0, 0]} maxBarSize={20} />
                    <Bar dataKey="completed" name="Completed" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </GlassCard>
        </StaggerItem>

        {/* Tasks by priority */}
        <StaggerItem>
          <GlassCard className="p-5 sm:p-6">
            <ChartHeader
              icon={Award}
              title="Tasks by Priority"
              subtitle="Completion distribution"
            />
            <div className="h-56 mt-4">
              {loading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : (data?.priorityStats?.length || 0) === 0 ? (
                <ChartEmpty />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data?.priorityStats || []}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="barPriority" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d946ef" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.5} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                    <XAxis
                      dataKey="priority"
                      tickLine={false}
                      axisLine={false}
                      className="text-[10px] fill-muted-foreground capitalize"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      className="text-[10px] fill-muted-foreground"
                      width={24}
                      allowDecimals={false}
                    />
                    <Tooltip cursor={{ fill: "rgba(217,70,239,0.08)" }} content={<ChartTooltip />} />
                    <Bar dataKey="total" name="Total" fill="#e9d5ff" radius={[4, 4, 0, 0]} maxBarSize={24} />
                    <Bar dataKey="completed" name="Completed" fill="url(#barPriority)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </GlassCard>
        </StaggerItem>

        {/* Attendance overview */}
        <StaggerItem>
          <GlassCard className="p-5 sm:p-6">
            <ChartHeader
              icon={GraduationCap}
              title="Attendance Overview"
              subtitle="Average & per-subject"
            />
            <div className="mt-4">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : (data?.subjectPerformance?.length || 0) === 0 ? (
                <ChartEmpty />
              ) : (
                <>
                  {/* Big avg circle */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative h-16 w-16 shrink-0">
                      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                        <circle
                          cx="18"
                          cy="18"
                          r="15.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          className="text-muted/30"
                        />
                        <motion.circle
                          cx="18"
                          cy="18"
                          r="15.5"
                          fill="none"
                          stroke="url(#attendanceGrad)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 15.5}
                          initial={reduceMotion ? false : { strokeDashoffset: 2 * Math.PI * 15.5 }}
                          animate={{
                            strokeDashoffset: 2 * Math.PI * 15.5 * (1 - avgAttendance / 100),
                          }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                        <defs>
                          <linearGradient id="attendanceGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#22c55e" />
                            <stop offset="100%" stopColor="#06b6d4" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold">
                          <AnimatedCounter value={avgAttendance} suffix="%" />
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Average attendance</p>
                      <p className="text-sm font-medium">
                        across {data?.subjectPerformance.length} subjects
                      </p>
                    </div>
                  </div>

                  {/* List */}
                  <div className="space-y-2.5 max-h-44 overflow-y-auto scrollbar-thin pr-1">
                    {(data?.subjectPerformance || []).map((s, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium truncate">{s.name}</span>
                          <span
                            className="text-xs font-semibold tabular-nums"
                            style={{ color: colorOf(s.color).chart }}
                          >
                            {s.attendance}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: colorOf(s.color).chart }}
                            initial={reduceMotion ? false : { width: 0 }}
                            animate={{ width: `${s.attendance}%` }}
                            transition={{ duration: 0.9, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </GlassCard>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}

// === Sub-components ===

function KpiCard({
  icon: Icon,
  label,
  value,
  suffix = "",
  decimals = 0,
  gradient,
  loading,
}: {
  icon: typeof Clock;
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  gradient: string;
  loading: boolean;
}) {
  return (
    <GlassCard className="p-5 relative overflow-hidden" hover>
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-lg bg-gradient-to-br",
            gradient
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {loading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <div className="text-2xl sm:text-3xl font-bold tabular-nums">
          <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
        </div>
      )}
    </GlassCard>
  );
}

function ChartHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Clock;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ChartEmpty() {
  return (
    <EmptyState
      icon={BarChart3}
      title="No data yet"
      description="Start tracking your activity to see beautiful insights here."
      className="h-full py-10"
    />
  );
}
