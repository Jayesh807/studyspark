"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Target,
  GraduationCap,
  Calendar,
  Pencil,
  Check,
  Loader2,
  BookOpen,
  School,
  BookMarked,
  Quote,
  Sparkles,
  Clock,
  Hash,
  ImageOff,
} from "lucide-react";
import { toast } from "sonner";

import { useAppStore } from "@/lib/store";
import { apiFetch, handleError } from "@/lib/api";
import type { Profile, Analytics } from "@/lib/types";

import {
  PageTransition,
  GlassCard,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/motion";
import { Skeleton, EmptyState } from "@/components/shared/feedback";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface MeResponse {
  user: { id: string; username: string; createdAt?: string } | null;
  profile?: Profile | null;
}

interface ProfileResponse {
  profile: Profile;
}

interface AnalyticsResponse {
  stats: Analytics["stats"];
}

const DEFAULT_PROFILE: Profile = {
  id: "",
  userId: "",
  bio: "",
  goal: "",
  targetHours: 6,
  college: "",
  course: "",
  semester: 1,
  avatar: "",
  studyStreak: 0,
};

interface FormState {
  bio: string;
  goal: string;
  targetHours: number;
  college: string;
  course: string;
  semester: number;
  avatar: string;
}

const ACCENT_HUE = "var(--accent-color)";

function getInitial(username: string | undefined): string {
  if (!username) return "S";
  return username.trim().charAt(0).toUpperCase() || "S";
}

function formatMemberSince(dateStr: string | undefined): string {
  if (!dateStr) return "Recently";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return "Recently";
  }
}

/* -------------------------------------------------------------------------- */
/*                              Animated Checkmark                            */
/* -------------------------------------------------------------------------- */

function AnimatedCheck() {
  return (
    <motion.svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 18 }}
    >
      <motion.path
        d="M20 6L9 17l-5-5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
      />
    </motion.svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Stat Card                                     */
/* -------------------------------------------------------------------------- */

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  hint?: string;
  gradient: string;
  delay?: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  decimals = 0,
  hint,
  gradient,
  delay = 0,
}: StatCardProps) {
  return (
    <StaggerItem delay={delay}>
      <GlassCard hover className="p-5 h-full">
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg",
              gradient
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          {hint && (
            <Badge
              variant="secondary"
              className="text-[10px] uppercase tracking-wide"
            >
              {hint}
            </Badge>
          )}
        </div>
        <div className="text-3xl font-bold tracking-tight">
          <AnimatedCounter value={value} suffix={suffix} decimals={decimals} />
        </div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </GlassCard>
    </StaggerItem>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Detail Card                                   */
/* -------------------------------------------------------------------------- */

interface DetailCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number | null | undefined;
  delay?: number;
}

function DetailCard({ icon: Icon, label, value, delay = 0 }: DetailCardProps) {
  const isEmpty =
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "");
  return (
    <StaggerItem delay={delay}>
      <GlassCard hover className="p-5 h-full">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
        </div>
        {isEmpty ? (
          <p className="text-sm text-muted-foreground/70 italic">Not set</p>
        ) : (
          <p className="text-base font-semibold truncate">{value}</p>
        )}
      </GlassCard>
    </StaggerItem>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Avatar                                        */
/* -------------------------------------------------------------------------- */

interface ProfileAvatarProps {
  username?: string;
  avatarUrl?: string;
  size?: number;
}

function ProfileAvatar({ username, avatarUrl, size = 96 }: ProfileAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = avatarUrl && avatarUrl.trim() !== "" && !imgError;
  const initial = getInitial(username);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size + 24, height: size + 24 }}
    >
      {/* Pulsing gradient ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, oklch(0.6 0.22 ${ACCENT_HUE}), oklch(0.65 0.2 calc(${ACCENT_HUE} + 30)), oklch(0.7 0.22 calc(${ACCENT_HUE} + 60)), oklch(0.6 0.22 ${ACCENT_HUE}))`,
          filter: "blur(8px)",
          opacity: 0.55,
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size + 8,
          height: size + 8,
          background: `linear-gradient(135deg, oklch(0.6 0.22 ${ACCENT_HUE}), oklch(0.7 0.2 calc(${ACCENT_HUE} + 35)))`,
          padding: 3,
        }}
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="h-full w-full rounded-full bg-background" />
      </motion.div>

      {/* Avatar content */}
      <div
        className="relative rounded-full overflow-hidden flex items-center justify-center text-white font-bold shadow-2xl"
        style={{
          width: size,
          height: size,
          background: `linear-gradient(135deg, oklch(0.58 0.22 ${ACCENT_HUE}), oklch(0.66 0.2 calc(${ACCENT_HUE} + 40)))`,
          fontSize: size * 0.4,
        }}
      >
        {showImage ? (
          <img
            src={avatarUrl}
            alt={username ?? "User avatar"}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : imgError && avatarUrl ? (
          <ImageOff className="h-7 w-7 opacity-80" />
        ) : (
          <span className="drop-shadow-sm">{initial}</span>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Edit Profile Dialog                           */
/* -------------------------------------------------------------------------- */

interface EditDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: Profile;
  onSaved: (p: Profile) => void;
}

type SaveState = "idle" | "saving" | "success";

/* Inner form — mounts fresh each time the dialog opens so useState
 * initializes from the current profile (avoids set-state-in-effect). */
function EditProfileForm({
  profile,
  onSaved,
  onCloseAfterSuccess,
}: {
  profile: Profile;
  onSaved: (p: Profile) => void;
  onCloseAfterSuccess: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    bio: profile.bio ?? "",
    goal: profile.goal ?? "",
    targetHours: profile.targetHours ?? 6,
    college: profile.college ?? "",
    course: profile.course ?? "",
    semester: profile.semester ?? 1,
    avatar: profile.avatar ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((e) => {
        const n = { ...e };
        delete n[key];
        return n;
      });
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (form.bio.length > 500) e.bio = "Bio must be 500 characters or less";
    if (form.goal.length > 200) e.goal = "Goal must be 200 characters or less";
    if (
      !Number.isFinite(form.targetHours) ||
      form.targetHours < 1 ||
      form.targetHours > 24
    )
      e.targetHours = "Target hours must be between 1 and 24";
    if (
      !Number.isFinite(form.semester) ||
      form.semester < 1 ||
      form.semester > 12
    )
      e.semester = "Semester must be between 1 and 12";
    if (form.avatar && form.avatar.length > 500)
      e.avatar = "Avatar URL is too long";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaveState("saving");
    try {
      const data = await apiFetch<ProfileResponse>("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          bio: form.bio.trim(),
          goal: form.goal.trim(),
          targetHours: Number(form.targetHours),
          college: form.college.trim(),
          course: form.course.trim(),
          semester: Number(form.semester),
          avatar: form.avatar.trim(),
        }),
      });
      onSaved(data.profile);
      setSaveState("success");
      toast.success("Profile updated!");
      setTimeout(() => {
        onCloseAfterSuccess();
        setSaveState("idle");
      }, 1100);
    } catch (error) {
      setSaveState("idle");
      handleError(error, "Failed to update profile");
    }
  };

  return (
    <>
      <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
              style={{
                background: `linear-gradient(135deg, oklch(0.58 0.22 ${ACCENT_HUE}), oklch(0.66 0.2 calc(${ACCENT_HUE} + 40)))`,
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </span>
            Edit Profile
          </DialogTitle>
          <DialogDescription>
            Update your personal info, study goal, and avatar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="edit-bio">
              Bio
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {form.bio.length}/500
              </span>
            </Label>
            <Textarea
              id="edit-bio"
              rows={3}
              placeholder="Tell us a bit about yourself..."
              value={form.bio}
              onChange={(e) => update("bio", e.target.value.slice(0, 500))}
              aria-invalid={!!errors.bio}
            />
            {errors.bio && (
              <p className="text-xs text-destructive">{errors.bio}</p>
            )}
          </div>

          {/* Goal */}
          <div className="space-y-2">
            <Label htmlFor="edit-goal">
              Study Goal
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {form.goal.length}/200
              </span>
            </Label>
            <Input
              id="edit-goal"
              placeholder="e.g. Ace every exam this semester"
              value={form.goal}
              onChange={(e) => update("goal", e.target.value.slice(0, 200))}
              aria-invalid={!!errors.goal}
            />
            {errors.goal && (
              <p className="text-xs text-destructive">{errors.goal}</p>
            )}
          </div>

          {/* Two column row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-target">Target hours / day</Label>
              <Input
                id="edit-target"
                type="number"
                min={1}
                max={24}
                value={form.targetHours}
                onChange={(e) =>
                  update("targetHours", parseInt(e.target.value || "0", 10))
                }
                aria-invalid={!!errors.targetHours}
              />
              {errors.targetHours && (
                <p className="text-xs text-destructive">{errors.targetHours}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-semester">Semester (1–12)</Label>
              <Input
                id="edit-semester"
                type="number"
                min={1}
                max={12}
                value={form.semester}
                onChange={(e) =>
                  update("semester", parseInt(e.target.value || "0", 10))
                }
                aria-invalid={!!errors.semester}
              />
              {errors.semester && (
                <p className="text-xs text-destructive">{errors.semester}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-college">College</Label>
              <Input
                id="edit-college"
                placeholder="e.g. Stanford University"
                value={form.college}
                onChange={(e) => update("college", e.target.value.slice(0, 100))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-course">Course</Label>
              <Input
                id="edit-course"
                placeholder="e.g. Computer Science"
                value={form.course}
                onChange={(e) => update("course", e.target.value.slice(0, 100))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-avatar">Avatar URL (optional)</Label>
            <Input
              id="edit-avatar"
              type="url"
              placeholder="https://example.com/avatar.png"
              value={form.avatar}
              onChange={(e) => update("avatar", e.target.value.slice(0, 500))}
              aria-invalid={!!errors.avatar}
            />
            {errors.avatar && (
              <p className="text-xs text-destructive">{errors.avatar}</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={saveState !== "idle"}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleSave}
            disabled={saveState !== "idle"}
            className="relative min-w-[140px] text-white"
            style={{
              background: `linear-gradient(135deg, oklch(0.58 0.22 ${ACCENT_HUE}), oklch(0.66 0.2 calc(${ACCENT_HUE} + 40)))`,
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {saveState === "idle" && (
                <motion.span
                  key="idle"
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  <Check className="h-4 w-4 opacity-0" />
                  Save Changes
                </motion.span>
              )}
              {saveState === "saving" && (
                <motion.span
                  key="saving"
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </motion.span>
              )}
              {saveState === "success" && (
                <motion.span
                  key="success"
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  <AnimatedCheck />
                  Saved!
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </DialogFooter>
    </>
  );
}

function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  onSaved,
}: EditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto scrollbar-thin">
        <EditProfileForm
          profile={profile}
          onSaved={onSaved}
          onCloseAfterSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Profile Hero                                  */
/* -------------------------------------------------------------------------- */

interface ProfileHeroProps {
  profile: Profile;
  username: string | undefined;
  memberSince: string;
  loading: boolean;
  onEdit: () => void;
}

function ProfileHero({
  profile,
  username,
  memberSince,
  loading,
  onEdit,
}: ProfileHeroProps) {
  if (loading) {
    return (
      <GlassCard className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-3 w-full">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </GlassCard>
    );
  }

  const hasBio = profile.bio && profile.bio.trim() !== "";
  const hasGoal = profile.goal && profile.goal.trim() !== "";

  return (
    <GlassCard className="p-6 sm:p-8 relative overflow-hidden">
      <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-7">
        <ProfileAvatar
          username={username}
          avatarUrl={profile.avatar}
          size={96}
        />

        <div className="flex-1 min-w-0 w-full text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
              {username ?? "Student"}
            </h2>
            <Badge
              className="mx-auto sm:mx-0 w-fit text-white"
              style={{
                background: `linear-gradient(135deg, oklch(0.58 0.22 ${ACCENT_HUE}), oklch(0.66 0.2 calc(${ACCENT_HUE} + 40)))`,
              }}
            >
              <Sparkles className="h-3 w-3" />
              Student
            </Badge>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-muted-foreground mb-4">
            <Calendar className="h-3.5 w-3.5" />
            <span>Member since {memberSince}</span>
          </div>

          {/* Bio */}
          <div className="mb-4">
            {hasBio ? (
              <p className="text-sm text-foreground/80 leading-relaxed">
                {profile.bio}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground/60 italic">
                No bio yet — click edit to introduce yourself.
              </p>
            )}
          </div>

          {/* Goal tagline */}
          {hasGoal && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-5 inline-flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm max-w-full"
            >
              <Quote className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span className="font-medium italic text-foreground/90">
                {profile.goal}
              </span>
            </motion.div>
          )}

          <div className="flex justify-center sm:justify-start">
            <Button
              onClick={onEdit}
              className="text-white"
              style={{
                background: `linear-gradient(135deg, oklch(0.58 0.22 ${ACCENT_HUE}), oklch(0.66 0.2 calc(${ACCENT_HUE} + 40)))`,
              }}
            >
              <Pencil className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Main Profile Page                             */
/* -------------------------------------------------------------------------- */

export function ProfilePage() {
  const user = useAppStore((s) => s.user);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Analytics["stats"] | null>(null);
  const [memberSince, setMemberSince] = useState<string>("Recently");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [meRes, analyticsRes] = await Promise.all([
        apiFetch<MeResponse>("/api/auth/me"),
        apiFetch<AnalyticsResponse>("/api/analytics").catch(() => null),
      ]);
      if (meRes.user) setMemberSince(formatMemberSince(meRes.user.createdAt));
      setProfile(meRes.profile ?? DEFAULT_PROFILE);
      if (analyticsRes) setStats(analyticsRes.stats);
    } catch (err) {
      handleError(err, "Failed to load profile");
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaved = (p: Profile) => {
    setProfile(p);
  };

  const safeProfile = profile ?? DEFAULT_PROFILE;
  const studyStreak = stats?.studyStreak ?? safeProfile.studyStreak ?? 0;
  const totalFocusHours = stats?.totalFocusHours ?? 0;
  const targetHours = safeProfile.targetHours ?? 6;
  const semester = safeProfile.semester ?? 1;

  return (
    <PageTransition>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              My <span className="text-gradient">Profile</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your personal info, study goal, and account details.
            </p>
          </div>
          {!loading && !error && (
            <Button
              onClick={() => setEditOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        {error ? (
          <GlassCard className="p-6">
            <EmptyState
              icon={GraduationCap}
              title="Couldn't load profile"
              description="Something went wrong while fetching your profile. Please try again."
              action={
                <Button onClick={load} variant="outline">
                  Retry
                </Button>
              }
            />
          </GlassCard>
        ) : (
          <StaggerContainer className="space-y-6 sm:space-y-8">
            {/* Hero */}
            <StaggerItem>
              <ProfileHero
                profile={safeProfile}
                username={user?.username}
                memberSince={memberSince}
                loading={loading}
                onEdit={() => setEditOpen(true)}
              />
            </StaggerItem>

            {/* Stats */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
                Snapshot
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={Flame}
                  label="Study Streak"
                  value={studyStreak}
                  suffix={studyStreak === 1 ? " day" : " days"}
                  hint="🔥"
                  gradient="bg-gradient-to-br from-orange-500 to-rose-500"
                  delay={0}
                />
                <StatCard
                  icon={Target}
                  label="Target / Day"
                  value={targetHours}
                  suffix="h"
                  gradient="bg-gradient-to-br from-violet-500 to-fuchsia-500"
                  delay={0.05}
                />
                <StatCard
                  icon={Clock}
                  label="Total Focus"
                  value={totalFocusHours}
                  suffix="h"
                  decimals={totalFocusHours % 1 !== 0 ? 1 : 0}
                  gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
                  delay={0.1}
                />
                <StatCard
                  icon={Hash}
                  label="Semester"
                  value={semester}
                  gradient="bg-gradient-to-br from-cyan-500 to-sky-500"
                  delay={0.15}
                />
              </div>
            </div>

            {/* Details */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
                Academic Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <DetailCard
                  icon={School}
                  label="College"
                  value={safeProfile.college}
                  delay={0}
                />
                <DetailCard
                  icon={BookOpen}
                  label="Course"
                  value={safeProfile.course}
                  delay={0.05}
                />
                <DetailCard
                  icon={BookMarked}
                  label="Semester"
                  value={safeProfile.semester}
                  delay={0.1}
                />
                <DetailCard
                  icon={Target}
                  label="Target Hours / Day"
                  value={
                    safeProfile.targetHours
                      ? `${safeProfile.targetHours}h`
                      : null
                  }
                  delay={0.15}
                />
              </div>
            </div>

            {/* Goal spotlight (when present and not shown in hero) */}
            {safeProfile.goal && safeProfile.goal.trim() !== "" && (
              <StaggerItem>
                <GlassCard className="p-6 relative overflow-hidden">
                  <div
                    className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full opacity-20 blur-3xl"
                    style={{
                      background: `radial-gradient(circle, oklch(0.6 0.22 ${ACCENT_HUE}), transparent 70%)`,
                    }}
                  />
                  <div className="flex items-start gap-3 relative">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white"
                      style={{
                        background: `linear-gradient(135deg, oklch(0.58 0.22 ${ACCENT_HUE}), oklch(0.66 0.2 calc(${ACCENT_HUE} + 40)))`,
                      }}
                    >
                      <Target className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Study Goal
                      </div>
                      <p className="text-lg font-semibold italic">
                        &ldquo;{safeProfile.goal}&rdquo;
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </StaggerItem>
            )}
          </StaggerContainer>
        )}
      </div>

      {/* Edit Dialog */}
      <EditProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        profile={safeProfile}
        onSaved={handleSaved}
      />
    </PageTransition>
  );
}

export default ProfilePage;
