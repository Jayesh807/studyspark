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
  Info,
  User,
  Calendar,
  Check,
  Loader2,
  Heart,
  Github,
  Globe,
  Mail,
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
/*                              Load Demo Data Dialog                         */
/* -------------------------------------------------------------------------- */

function LoadDemoDataDialog() {
  const [seeding, setSeeding] = useState(false);
  const setView = useAppStore((s) => s.setView);

  const handleSeed = useCallback(async () => {
    setSeeding(true);
    try {
      await apiFetch<{ success: boolean; message: string }>("/api/seed", {
        method: "POST",
      });
      toast.success("Demo data loaded! Explore the dashboard.");
      setView("dashboard");
    } catch (error) {
      handleError(error, "Failed to load demo data");
    } finally {
      setSeeding(false);
    }
  }, [setView]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          className="gap-2 text-white shadow-md transition-all hover:shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.6 0.2 277), oklch(0.65 0.22 300), oklch(0.58 0.2 330))",
          }}
          disabled={seeding}
        >
          {seeding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {seeding ? "Loading..." : "Load Demo Data"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Load demo data?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will replace all your current data with demo data. Continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={seeding}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleSeed();
            }}
            disabled={seeding}
            className="bg-violet-600 text-white hover:bg-violet-700"
          >
            {seeding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Yes, load demo data
              </>
            )}
          </AlertDialogAction>
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

  // Data import state
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [importResult, setImportResult] = useState<{
    ok: boolean;
    message: string;
    counts?: Record<string, number | boolean>;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const runImport = useCallback(
    async (file: File) => {
      if (!file) return;
      const isJson =
        file.type === "application/json" || file.name.toLowerCase().endsWith(".json");
      if (!isJson) {
        setImportResult({
          ok: false,
          message: "Please select a JSON backup file (.json).",
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setImportResult({
          ok: false,
          message: "That file is too large (max 10 MB).",
        });
        return;
      }
      setImporting(true);
      setImportResult(null);
      const toastId = toast.loading("Importing backup…");
      try {
        const text = await file.text();
        const payload = JSON.parse(text);
        const res = await fetch(
          `/api/import?mode=${encodeURIComponent(importMode)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error ?? "Import failed");
        }
        const c = data.imported ?? {};
        const parts: string[] = [];
        if (c.todos) parts.push(`${c.todos} tasks`);
        if (c.subjects) parts.push(`${c.subjects} subjects`);
        if (c.exams) parts.push(`${c.exams} exams`);
        if (c.events) parts.push(`${c.events} events`);
        if (c.focusSessions) parts.push(`${c.focusSessions} focus sessions`);
        const summary = parts.length ? parts.join(" · ") : "no records";
        setImportResult({
          ok: true,
          message: `Import complete — ${summary}.`,
          counts: c as Record<string, number | boolean>,
        });
        toast.success("Backup imported successfully", {
          id: toastId,
          description: summary,
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Invalid or corrupted backup file.";
        setImportResult({ ok: false, message: msg });
        toast.error("Import failed", { id: toastId, description: msg });
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [importMode]
  );

  const handleExport = useCallback(async (type: string) => {
    const labels: Record<string, string> = {
      "all-json": "JSON backup",
      todos: "Tasks CSV",
      subjects: "Subjects CSV",
      exams: "Exams CSV",
      focus: "Focus sessions CSV",
    };
    const label = labels[type] ?? "Export";
    const toastId = toast.loading(`Preparing ${label}…`);
    try {
      const res = await fetch(`/api/export?type=${encodeURIComponent(type)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Export failed");
      }
      const blob = await res.blob();
      // Extract filename from Content-Disposition header, fallback to generated name
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename="?([^"]+)"?/);
      const filename =
        match?.[1] ??
        `studyspark-${type}-${new Date().toISOString().slice(0, 10)}.${type === "all-json" ? "json" : "csv"}`;
      // Trigger download via a temporary anchor
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${label} downloaded`, {
        id: toastId,
        description: filename,
      });
    } catch (err) {
      toast.error(`Failed to export ${label}`, {
        id: toastId,
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }, []);

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
            <Separator />
            <div className="py-3">
              <div className="flex items-start gap-3 mb-3">
                <Sparkles className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-sm font-medium">Accent Color</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Highlights, buttons, and charts use this hue.
                  </div>
                </div>
              </div>
              <div className="pl-7">
                <AccentPicker />
              </div>
              <div className="pl-7 mt-2 text-[11px] text-muted-foreground">
                Current accent:{" "}
                <span className="font-medium text-foreground">
                  {ACCENT_OPTIONS.find((o) => o.hue === accentColor)?.label ??
                    "Violet"}
                </span>
              </div>
            </div>
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
                      value={user?.username ?? "—"}
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

          {/* Data Export */}
          <SettingsSection
            icon={Download}
            title="Data Export"
            description="Download your data for backup, analysis, or transfer. Available as CSV or a complete JSON backup."
            delay={0.11}
          >
            <div className="py-2 space-y-5">
              {/* Full JSON backup — featured */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-violet-500/30 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-transparent p-4">
                <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25">
                    <FileJson className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold">Complete Backup (JSON)</h4>
                      <Badge className="bg-violet-500/15 text-violet-600 dark:text-violet-300 text-[10px]">
                        Recommended
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Everything in one file — profile, tasks, subjects, exams, events & focus sessions.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1.5 shrink-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
                    onClick={() => handleExport("all-json")}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </div>
              </div>

              {/* CSV exports grid */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Individual CSV Exports
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { type: "todos", label: "Tasks", emoji: "📋" },
                    { type: "subjects", label: "Subjects", emoji: "📚" },
                    { type: "exams", label: "Exams", emoji: "📝" },
                    { type: "focus", label: "Focus", emoji: "🎯" },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleExport(item.type)}
                      className="group relative flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background/40 p-3 text-center transition-all hover:border-violet-500/40 hover:bg-violet-500/5 hover:shadow-md focus-ring-accent"
                      aria-label={`Export ${item.label} as CSV`}
                    >
                      <span className="text-xl transition-transform group-hover:scale-110">{item.emoji}</span>
                      <span className="text-xs font-medium">{item.label}</span>
                      <span className="text-[10px] text-muted-foreground">CSV</span>
                      <Download className="absolute top-1.5 right-1.5 h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <p>
                  Exports are generated on-demand from your live data. The JSON backup includes metadata and stats for easy restoration or migration.
                </p>
              </div>
            </div>
          </SettingsSection>

          {/* Data Import */}
          <SettingsSection
            icon={Upload}
            title="Data Import"
            description="Restore a StudySpark JSON backup. Merge into your current data, or replace it entirely."
            delay={0.115}
          >
            <div className="py-2 space-y-4">
              {/* Mode toggle */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode("merge")}
                  className={cn(
                    "flex-1 flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all focus-ring-accent",
                    importMode === "merge"
                      ? "border-violet-500/50 bg-violet-500/10 shadow-sm"
                      : "border-border bg-background/40 hover:border-violet-500/30"
                  )}
                  aria-pressed={importMode === "merge"}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                      importMode === "merge"
                        ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <GitMerge className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">Merge</div>
                    <div className="text-[11px] text-muted-foreground">Add backup records to your existing data.</div>
                  </div>
                  {importMode === "merge" && (
                    <Check className="h-4 w-4 text-violet-500 ml-auto shrink-0" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode("replace")}
                  className={cn(
                    "flex-1 flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all focus-ring-accent",
                    importMode === "replace"
                      ? "border-rose-500/50 bg-rose-500/10 shadow-sm"
                      : "border-border bg-background/40 hover:border-rose-500/30"
                  )}
                  aria-pressed={importMode === "replace"}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                      importMode === "replace"
                        ? "bg-gradient-to-br from-rose-500 to-orange-500 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">Replace</div>
                    <div className="text-[11px] text-muted-foreground">Wipe current data, then restore backup.</div>
                  </div>
                  {importMode === "replace" && (
                    <Check className="h-4 w-4 text-rose-500 ml-auto shrink-0" />
                  )}
                </button>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) runImport(f);
                }}
                className={cn(
                  "relative overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition-all",
                  dragOver
                    ? "border-violet-500 bg-violet-500/10 scale-[1.01]"
                    : "border-border bg-background/40 hover:border-violet-500/40"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) runImport(f);
                  }}
                />
                <motion.div
                  animate={dragOver ? { y: -4 } : { y: 0 }}
                  className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 text-violet-500"
                >
                  {importing ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Upload className="h-6 w-6" />
                  )}
                </motion.div>
                <p className="text-sm font-medium">
                  {importing ? "Importing…" : "Drop your JSON backup here"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  or{" "}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-violet-500 hover:text-violet-600 font-medium underline-offset-2 hover:underline"
                    disabled={importing}
                  >
                    browse your files
                  </button>
                </p>
              </div>

              {/* Result banner */}
              <AnimatePresence>
                {importResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={cn(
                      "flex items-start gap-2.5 rounded-xl border p-3 text-sm",
                      importResult.ok
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                    )}
                  >
                    {importResult.ok ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    ) : (
                      <FileWarning className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium leading-snug">
                        {importResult.ok ? "Import successful" : "Import failed"}
                      </p>
                      <p className="text-xs opacity-90 mt-0.5 break-words">
                        {importResult.message}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground">
                <FileWarning className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <p>
                  Only import backups exported from StudySpark. In <span className="font-medium text-foreground">Replace</span> mode, your current tasks, subjects, exams, events and focus sessions are permanently deleted before the restore.
                </p>
              </div>
            </div>
          </SettingsSection>

          {/* Demo Data */}
          <SettingsSection
            icon={Sparkles}
            title="Demo Data"
            description="Load sample data to explore all features. This will replace your current data."
            delay={0.12}
          >
            <div className="py-2">
              <p className="text-sm text-muted-foreground mb-4">
                Populate your dashboard with realistic sample data including
                subjects, tasks, events, exams, and focus sessions — perfect for
                exploring everything StudySpark has to offer.
              </p>
              <LoadDemoDataDialog />
            </div>
          </SettingsSection>

          {/* About */}
          <SettingsSection
            icon={Info}
            title="About"
            description="A little about the app you're using."
            delay={0.15}
          >
            <div className="py-2 space-y-4">
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
                  { icon: Globe, label: "Website" },
                  { icon: Github, label: "GitHub" },
                  { icon: Mail, label: "Contact" },
                ].map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toast.info(`${label} link is decorative`)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                Made with <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />{" "}
                for students everywhere.
              </div>
            </div>
          </SettingsSection>
        </StaggerContainer>
      </div>
    </PageTransition>
  );
}

export default SettingsPage;
