"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Bell,
  Sparkles,
  PanelLeft,
  LogOut,
  Trash2,
  User,
  Calendar,
  Check,
  Loader2,
  Heart,
  AlertTriangle,
  GraduationCap,
  RotateCcw,
  Download,
  FileJson,
  FileSpreadsheet,
  Clock,
  Upload,
  CheckCircle2,
  RefreshCw,
  FileWarning,
  GitMerge,
} from "lucide-react";
import { toast } from "sonner";

import { useAppStore, type AccentColor } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch, handleError } from "@/lib/api";
import { replayTour } from "@/components/dashboard/onboarding-tour";
import type { Todo, Subject, Event, Exam } from "@/lib/types";

import {
  PageTransition,
  GlassCard,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/motion";
import { Skeleton } from "@/components/shared/feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                              Constants                                     */
/* -------------------------------------------------------------------------- */

interface AccentOption {
  hue: AccentColor;
  label: string;
}

const ACCENT_OPTIONS: AccentOption[] = [
  { hue: "277", label: "Violet" },
  { hue: "300", label: "Purple" },
  { hue: "162", label: "Emerald" },
  { hue: "16", label: "Rose" },
  { hue: "200", label: "Cyan" },
  { hue: "70", label: "Amber" },
];

function accentSwatchStyle(hue: AccentColor): React.CSSProperties {
  return { backgroundColor: `oklch(0.6 0.2 ${hue})` };
}

function accentGradientStyle(hue: string): React.CSSProperties {
  return {
    background: `linear-gradient(135deg, oklch(0.58 0.22 ${hue}), oklch(0.66 0.2 calc(${hue} + 40)))`,
  };
}

interface ThemeOption {
  value: "light" | "dark" | "system";
  label: string;
  icon: React.ElementType;
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/* -------------------------------------------------------------------------- */
/*                              Section Heading                               */
/* -------------------------------------------------------------------------- */

interface SectionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  delay?: number;
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
  delay = 0,
}: SectionProps) {
  return (
    <StaggerItem delay={delay}>
      <GlassCard className="p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-5">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
            style={accentGradientStyle("var(--accent-color)")}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold leading-tight">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          </div>
        </div>
        <div className="space-y-1">{children}</div>
      </GlassCard>
    </StaggerItem>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Row Component                                 */
/* -------------------------------------------------------------------------- */

interface RowProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  icon?: React.ElementType;
}

function SettingsRow({ title, description, children, icon: Icon }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
        )}
        <div className="min-w-0">
          <div className="text-sm font-medium">{title}</div>
          {description && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {description}
            </div>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Theme Toggle                                  */
/* -------------------------------------------------------------------------- */

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes resolves the theme on the client only; track mount so we
  // render the active state without causing SSR/CSR hydration mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="inline-flex h-9 items-center rounded-lg bg-muted p-[3px] gap-1">
        {THEME_OPTIONS.map((t) => (
          <div
            key={t.value}
            className="h-[calc(100%-1px)] w-20 rounded-md bg-muted-foreground/10"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="inline-flex h-9 items-center rounded-lg bg-muted p-[3px] gap-1">
      {THEME_OPTIONS.map((opt) => {
        const active = theme === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={cn(
              "relative inline-flex h-[calc(100%-1px)] items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.div
                layoutId="theme-active"
                className="absolute inset-0 rounded-md bg-background shadow-sm border border-border"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Accent Picker                                 */
/* -------------------------------------------------------------------------- */

function AccentPicker() {
  const accentColor = useAppStore((s) => s.accentColor);
  const setAccentColor = useAppStore((s) => s.setAccentColor);

  return (
    <div className="flex flex-wrap gap-3">
      {ACCENT_OPTIONS.map((opt) => {
        const active = accentColor === opt.hue;
        return (
          <motion.button
            key={opt.hue}
            type="button"
            onClick={() => setAccentColor(opt.hue)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "group relative flex flex-col items-center gap-1.5 rounded-2xl p-2 transition-all",
              active ? "bg-muted/60" : "hover:bg-muted/40"
            )}
            aria-label={`Set accent to ${opt.label}`}
            aria-pressed={active}
          >
            <div
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-background transition-all",
                active ? "ring-foreground" : "ring-transparent"
              )}
              style={accentSwatchStyle(opt.hue)}
            >
              <AnimatePresence>
                {active && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 22,
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Check className="h-5 w-5 text-white drop-shadow" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <span
              className={cn(
                "text-[11px] font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {opt.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Animated Switch Row                           */
/* -------------------------------------------------------------------------- */

interface SwitchRowProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}

function SwitchRow({
  title,
  description,
  icon: Icon,
  checked,
  onCheckedChange,
}: SwitchRowProps) {
  return (
    <SettingsRow title={title} description={description} icon={Icon}>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </SettingsRow>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Action Row                                    */
/* -------------------------------------------------------------------------- */
//
// Like SwitchRow but the right-side control is an arbitrary React node (used
// for the "Replay onboarding tour" button). Keeps the same left-aligned
// icon + title + description layout so rows stay visually consistent.
interface ActionRowProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}

function ActionRow({
  title,
  description,
  icon: Icon,
  children,
}: ActionRowProps) {
  return (
    <SettingsRow title={title} description={description} icon={Icon}>
      {children}
    </SettingsRow>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Reset Data Dialog                             */
/* -------------------------------------------------------------------------- */

interface ResetState {
  status: "idle" | "fetching" | "deleting" | "done";
  current: number;
  total: number;
  label: string;
}

function ResetDataDialog() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ResetState>({
    status: "idle",
    current: 0,
    total: 0,
    label: "",
  });

  const reset = useCallback(async () => {
    setState({
      status: "fetching",
      current: 0,
      total: 0,
      label: "Fetching your data...",
    });
    try {
      const [todosRes, subjectsRes, eventsRes, examsRes] = await Promise.all([
        apiFetch<{ todos: Todo[] }>("/api/todos"),
        apiFetch<{ subjects: Subject[] }>("/api/subjects"),
        apiFetch<{ events: Event[] }>("/api/events"),
        apiFetch<{ exams: Exam[] }>("/api/exams"),
      ]);

      const items: { id: string; type: string; label: string }[] = [
        ...todosRes.todos.map((t) => ({
          id: t.id,
          type: "todos",
          label: "tasks",
        })),
        ...subjectsRes.subjects.map((s) => ({
          id: s.id,
          type: "subjects",
          label: "subjects",
        })),
        ...eventsRes.events.map((e) => ({
          id: e.id,
          type: "events",
          label: "events",
        })),
        ...examsRes.exams.map((e) => ({
          id: e.id,
          type: "exams",
          label: "exams",
        })),
      ];

      setState({
        status: "deleting",
        current: 0,
        total: items.length,
        label: "Deleting your data...",
      });

      let deleted = 0;
      for (const item of items) {
        await apiFetch(`/api/${item.type}/${item.id}`, { method: "DELETE" });
        deleted++;
        setState({
          status: "deleting",
          current: deleted,
          total: items.length,
          label: `Deleting ${item.label}...`,
        });
      }

      // Reset profile to defaults
      setState((s) => ({
        ...s,
        label: "Resetting profile...",
      }));
      await apiFetch("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          bio: "",
          goal: "",
          targetHours: 6,
          college: "",
          course: "",
          semester: 1,
          avatar: "",
        }),
      });

      setState((s) => ({ ...s, status: "done", current: s.total }));
      toast.success("All your data has been reset.");
      setTimeout(() => {
        setOpen(false);
        setState({
          status: "idle",
          current: 0,
          total: 0,
          label: "",
        });
      }, 1400);
    } catch (error) {
      handleError(error, "Failed to reset all data");
      setState({
        status: "idle",
        current: 0,
        total: 0,
        label: "",
      });
    }
  }, []);

  const isWorking =
    state.status === "fetching" || state.status === "deleting";
  const pct =
    state.total > 0 ? Math.round((state.current / state.total) * 100) : 0;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!isWorking) setOpen(v);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Reset All My Data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Reset all your data?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all of your tasks, subjects, events,
            exams, and reset your profile to defaults. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isWorking && (
          <div className="space-y-2 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {state.label}
              </span>
              <span className="font-medium">
                {state.total > 0
                  ? `${state.current}/${state.total} (${pct}%)`
                  : "…"}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-destructive"
                initial={{ width: 0 }}
                animate={{
                  width: `${state.status === "fetching" ? 8 : pct}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {state.status === "done" && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            <Check className="h-4 w-4" />
            All data reset successfully.
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isWorking}>
            {state.status === "done" ? "Close" : "Cancel"}
          </AlertDialogCancel>
          {state.status !== "done" && (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void reset();
              }}
              disabled={isWorking}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isWorking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Yes, reset everything
                </>
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}



/* -------------------------------------------------------------------------- */
/*                              Main Settings Page                            */
/* -------------------------------------------------------------------------- */

export function SettingsPage() {
  const {
    user,
    accentColor,
    notifications,
    setNotifications,
    reduceMotion,
    setReduceMotion,
    sidebarOpen,
    setSidebarOpen,
  } = useAppStore();
  const { logout } = useAuth();

  const [memberSince, setMemberSince] = useState<string>("Recently");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);



  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await apiFetch<{
          user: { id: string; username: string; createdAt?: string } | null;
        }>("/api/auth/me");
        if (!active) return;
        if (me.user?.createdAt) {
          try {
            const d = new Date(me.user.createdAt);
            if (!isNaN(d.getTime())) {
              setMemberSince(
                d.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })
              );
            }
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch {
      toast.error("Logout failed");
    } finally {
      setLoggingOut(false);
    }
  };



  return (
    <PageTransition>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Sett<span className="text-gradient">ings</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize StudySpark to match your style and preferences.
          </p>
        </div>

        <StaggerContainer className="space-y-5 sm:space-y-6">
          {/* Appearance */}
          <SettingsSection
            icon={Palette}
            title="Appearance"
            description="Pick a theme and accent color that feels like you."
            delay={0}
          >
            <SettingsRow
              title="Theme"
              description="Switch between light, dark, or system appearance."
              icon={Sun}
            >
              <ThemeToggle />
            </SettingsRow>
          </SettingsSection>

          {/* Preferences */}
          <SettingsSection
            icon={Bell}
            title="Preferences"
            description="Fine-tune notifications, motion, and layout behavior."
            delay={0.05}
          >
            <SwitchRow
              title="Notifications"
              description="Get reminded about tasks, exams, and focus sessions."
              icon={Bell}
              checked={notifications}
              onCheckedChange={(v) => {
                setNotifications(v);
                toast.success(`Notifications ${v ? "enabled" : "disabled"}`);
              }}
            />
            <Separator />
            <SwitchRow
              title="Reduce Motion"
              description="Disable animations and transitions app-wide."
              icon={Sparkles}
              checked={reduceMotion}
              onCheckedChange={(v) => {
                setReduceMotion(v);
                toast.success(`Motion ${v ? "reduced" : "enabled"}`);
              }}
            />
            <Separator />
            <SwitchRow
              title="Default Sidebar Collapsed"
              description="Start with the sidebar collapsed on desktop."
              icon={PanelLeft}
              checked={!sidebarOpen}
              onCheckedChange={(v) => setSidebarOpen(!v)}
            />
            <Separator />
            <ActionRow
              title="Replay onboarding tour"
              description="See the 5-step tour again to rediscover key features."
              icon={GraduationCap}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  replayTour();
                  toast.success("Replaying tour...");
                }}
                className="gap-1.5 transition-all hover:border-violet-500/40 hover:bg-violet-500/5 hover:text-violet-600 dark:hover:text-violet-300"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Replay tour
              </Button>
            </ActionRow>
          </SettingsSection>

          {/* Account */}
          <SettingsSection
            icon={User}
            title="Account"
            description="Manage your session and account data."
            delay={0.1}
          >
            <div className="py-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Username
                  </label>
                  {loading ? (
                    <Skeleton className="h-9 w-full rounded-md" />
                  ) : (
                    <Input
                      value={user?.username || "—"}
                      readOnly
                      disabled
                      className="bg-muted/40"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Member Since
                  </label>
                  {loading ? (
                    <Skeleton className="h-9 w-full rounded-md" />
                  ) : (
                    <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{memberSince}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="gap-2"
                >
                  {loggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  {loggingOut ? "Logging out..." : "Log Out"}
                </Button>
                <ResetDataDialog />
              </div>
            </div>
          </SettingsSection>



          {/* About */}
          <StaggerItem delay={0.15}>
            <GlassCard className="p-5 sm:p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg"
                    style={accentGradientStyle("var(--accent-color)")}
                  >
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold">StudySpark</h4>
                      <Badge variant="secondary" className="text-[10px]">
                        v1.0.0
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      A premium student analytics companion.
                    </p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  StudySpark helps you track tasks, manage your study schedule,
                  monitor focus sessions, and visualize your academic progress —
                  all in one beautiful dashboard.
                </p>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      label: "LinkedIn",
                      url: "https://www.linkedin.com",
                      svgPath: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
                    },
                    {
                      label: "X",
                      url: "https://x.com",
                      svgPath: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
                    },
                    {
                      label: "Instagram",
                      url: "https://www.instagram.com",
                      svgPath: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
                    },
                  ].map(({ label, url, svgPath }) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d={svgPath} />
                      </svg>
                      {label}
                    </a>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                  Made with <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />{" "}
                  for students everywhere.
                </div>
              </div>
            </GlassCard>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  );
}

export default SettingsPage;
