"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  User,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useAppStore } from "@/lib/store";
import { apiFetch, handleError } from "@/lib/api";
import { readPageCache, writePageCache } from "@/lib/page-cache";
import type { Profile, Analytics } from "@/lib/types";

import {
  PageTransition,
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
  user?: { id: string; username: string; email?: string | null };
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
  username: string;
  bio: string;
  goal: string;
  targetHours: number;
  college: string;
  course: string;
  semester: number;
  avatar: string;
}

const ACCENT_HUE = "var(--accent-color)";
const FORM_FIELD_CLASS =
  "rounded-lg border-border/75 bg-background/90 shadow-sm transition-colors hover:bg-card focus-visible:border-violet-400/70 focus-visible:ring-violet-500/20 dark:border-border/55 dark:bg-background/60 dark:hover:bg-background/75";
const FORM_LABEL_CLASS = "text-sm font-semibold text-foreground/90";
const FORM_DIALOG_CLASS =
  "dashboard-surface sm:max-w-[600px] rounded-lg max-h-[90vh] overflow-y-auto p-0 shadow-2xl shadow-slate-950/15 backdrop-blur-2xl";

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
  const cleanHint = hint && /^[\x20-\x7E]+$/.test(hint) ? hint : "Active";

  return (
    <div className="dashboard-surface h-full p-3 sm:p-5">
        <div className="mb-2 flex items-start justify-between sm:mb-3">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-sm ring-1 ring-white/20 dark:ring-white/10 sm:h-10 sm:w-10",
              gradient
            )}
          >
            <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </div>
          {hint && (
            <Badge
              variant="secondary"
              className="text-[10px] uppercase tracking-wide"
            >
              {cleanHint}
            </Badge>
          )}
        </div>
        <div className="text-2xl font-bold tracking-tight sm:text-3xl">
          <AnimatedCounter value={value} suffix={suffix} decimals={decimals} />
        </div>
        <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground sm:mt-1 sm:text-xs">{label}</div>
    </div>
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
    <div className="dashboard-surface h-full p-3 sm:p-5">
        <div className="mb-2 flex items-center gap-2 sm:mb-3 sm:gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-9 sm:w-9">
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
            {label}
          </span>
        </div>
        {isEmpty ? (
          <p className="text-sm text-muted-foreground/70 italic">Not set</p>
        ) : (
          <p className="truncate text-sm font-semibold sm:text-base">{value}</p>
        )}
    </div>
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
  username: string;
  onSaved: (p: Profile, username?: string) => void;
}

type SaveState = "idle" | "saving" | "success";

/* Inner form — mounts fresh each time the dialog opens so useState
 * initializes from the current profile (avoids set-state-in-effect). */
function EditProfileForm({
  profile,
  username,
  onSaved,
  onCloseAfterSuccess,
}: {
  profile: Profile;
  username: string;
  onSaved: (p: Profile, username?: string) => void;
  onCloseAfterSuccess: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    username,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Compress an image file to a small JPEG Base64 string */
  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const MAX_SIZE = 256;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let w = img.width;
          let h = img.height;
          // Scale down to MAX_SIZE x MAX_SIZE while preserving aspect ratio
          if (w > h) {
            if (w > MAX_SIZE) { h = Math.round((h * MAX_SIZE) / w); w = MAX_SIZE; }
          } else {
            if (h > MAX_SIZE) { w = Math.round((w * MAX_SIZE) / h); h = MAX_SIZE; }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected
    e.target.value = "";
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, avatar: "Image must be under 2 MB." }));
      return;
    }
    try {
      const base64 = await compressImage(file);
      update("avatar", base64);
    } catch {
      setErrors((prev) => ({ ...prev, avatar: "Failed to process image." }));
    }
  };

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
    const trimmedUsername = form.username.trim();
    if (trimmedUsername.length < 3)
      e.username = "Username must be at least 3 characters";
    if (trimmedUsername.length > 20)
      e.username = "Username must be at most 20 characters";
    if (trimmedUsername && !/^[a-zA-Z0-9_]+$/.test(trimmedUsername))
      e.username = "Only letters, numbers, and underscores allowed";
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
    if (form.avatar && form.avatar.length > 200000)
      e.avatar = "Avatar image is too large. Please choose a smaller image.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const updatedUsername = form.username.trim();
    const optimisticProfile: Profile = {
      ...profile,
      bio: form.bio.trim(),
      goal: form.goal.trim(),
      targetHours: Number(form.targetHours),
      college: form.college.trim(),
      course: form.course.trim(),
      semester: Number(form.semester),
      avatar: form.avatar.trim(),
    };

    setSaveState("saving");
    onSaved(optimisticProfile, updatedUsername);

    try {
      const data = await apiFetch<ProfileResponse>("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          username: updatedUsername,
          bio: optimisticProfile.bio,
          goal: optimisticProfile.goal,
          targetHours: optimisticProfile.targetHours,
          college: optimisticProfile.college,
          course: optimisticProfile.course,
          semester: optimisticProfile.semester,
          avatar: optimisticProfile.avatar,
        }),
      });
      onSaved(data.profile, data.user?.username ?? updatedUsername);
      setSaveState("success");
      toast.success("Profile updated");
      onCloseAfterSuccess();
    } catch (error) {
      onSaved(profile, username);
      setSaveState("idle");
      handleError(error, "Failed to update profile");
    }
  };

  return (
    <>
      <div className="border-b border-border/60 p-4 sm:p-5">
      <DialogHeader className="space-y-2">
        <DialogTitle className="flex items-center gap-3 text-xl tracking-tight">
          <span
            className="dashboard-icon-tile dashboard-theme-glow-text"
            style={{
              background: `linear-gradient(135deg, oklch(0.58 0.22 ${ACCENT_HUE}), oklch(0.66 0.2 calc(${ACCENT_HUE} + 40)))`,
            }}
          >
            <Pencil className="h-4 w-4" />
          </span>
          Edit Profile
        </DialogTitle>
        <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
          Update your personal info, study goal, and avatar.
        </DialogDescription>
      </DialogHeader>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {/* Username */}
        <div className="dashboard-row space-y-2 p-3">
          <Label htmlFor="edit-username" className={FORM_LABEL_CLASS}>Username</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="edit-username"
              placeholder="3-20 chars, letters/numbers/_"
              value={form.username}
              onChange={(e) => update("username", e.target.value.slice(0, 20))}
              className={cn(FORM_FIELD_CLASS, "pl-9")}
              aria-invalid={!!errors.username}
            />
          </div>
          {errors.username && (
            <p className="text-xs text-destructive">{errors.username}</p>
          )}
        </div>

        {/* Profile Photo Upload */}
        <div className="dashboard-row space-y-2 p-3">
          <Label className={FORM_LABEL_CLASS}>Profile Photo</Label>
          <div className="flex items-center gap-4">
            {/* Preview */}
            <div className="relative shrink-0 h-16 w-16 rounded-full border-2 border-border shadow-sm overflow-hidden bg-muted flex items-center justify-center">
              {form.avatar ? (
                <img
                  src={form.avatar}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-7 w-7 text-muted-foreground" />
              )}
              {form.avatar && (
                <button
                  type="button"
                  onClick={() => update("avatar", "")}
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow-md hover:bg-destructive/90 transition-colors"
                  title="Remove photo"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {/* Upload button */}
            <div className="flex flex-col gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 rounded-lg border-border/70 bg-background/85 shadow-sm hover:bg-muted/60 dark:border-border/60 dark:bg-background/60"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                {form.avatar ? "Change Photo" : "Upload Photo"}
              </Button>
              <p className="text-[11px] text-muted-foreground">
                PNG, JPG, or WebP. Max 2 MB.
              </p>
            </div>
          </div>
          {errors.avatar && (
            <p className="text-xs text-destructive">{errors.avatar}</p>
          )}
        </div>

        {/* Bio */}
        <div className="dashboard-row space-y-2 p-3">
          <Label htmlFor="edit-bio" className={FORM_LABEL_CLASS}>
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
            className={cn(FORM_FIELD_CLASS, "resize-none")}
          />
          {errors.bio && (
            <p className="text-xs text-destructive">{errors.bio}</p>
          )}
        </div>

        {/* Goal */}
        <div className="dashboard-row space-y-2 p-3">
          <Label htmlFor="edit-goal" className={FORM_LABEL_CLASS}>
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
            className={FORM_FIELD_CLASS}
          />
          {errors.goal && (
            <p className="text-xs text-destructive">{errors.goal}</p>
          )}
        </div>

        {/* Two column row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="dashboard-row space-y-2 p-3">
            <Label htmlFor="edit-target" className={FORM_LABEL_CLASS}>Target hours / day</Label>
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
              className={FORM_FIELD_CLASS}
            />
            {errors.targetHours && (
              <p className="text-xs text-destructive">{errors.targetHours}</p>
            )}
          </div>
          <div className="dashboard-row space-y-2 p-3">
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
              className={FORM_FIELD_CLASS}
            />
            {errors.semester && (
              <p className="text-xs text-destructive">{errors.semester}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="dashboard-row space-y-2 p-3">
            <Label htmlFor="edit-college" className={FORM_LABEL_CLASS}>College</Label>
            <Input
              id="edit-college"
              placeholder="e.g. Stanford University"
              value={form.college}
              onChange={(e) => update("college", e.target.value.slice(0, 100))}
              className={FORM_FIELD_CLASS}
            />
          </div>
          <div className="dashboard-row space-y-2 p-3">
            <Label htmlFor="edit-course" className={FORM_LABEL_CLASS}>Course</Label>
            <Input
              id="edit-course"
              placeholder="e.g. Computer Science"
              value={form.course}
              onChange={(e) => update("course", e.target.value.slice(0, 100))}
              className={FORM_FIELD_CLASS}
            />
          </div>
        </div>

        <div className="dashboard-row space-y-2 p-3">
          <Label htmlFor="edit-avatar" className={FORM_LABEL_CLASS}>Avatar URL (optional)</Label>
          <Input
            id="edit-avatar"
            type="url"
            placeholder="https://example.com/avatar.png"
            value={form.avatar}
            onChange={(e) => update("avatar", e.target.value.slice(0, 500))}
            aria-invalid={!!errors.avatar}
            className={FORM_FIELD_CLASS}
          />
          {errors.avatar && (
            <p className="text-xs text-destructive">{errors.avatar}</p>
          )}
        </div>
      </div>

      <DialogFooter className="gap-2 border-t border-border/60 bg-background/55 p-4 sm:p-5">
        <DialogClose asChild>
          <Button variant="outline" disabled={saveState !== "idle"} className="h-10 rounded-lg border-border/70 bg-background/85 px-4 shadow-sm hover:bg-muted/60 dark:border-border/60 dark:bg-background/60">
            Cancel
          </Button>
        </DialogClose>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saveState !== "idle"}
          className="relative h-10 min-w-[150px] rounded-lg px-4 text-white shadow-md shadow-violet-500/20"
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
  username,
  onSaved,
}: EditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={FORM_DIALOG_CLASS}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <EditProfileForm
          profile={profile}
          username={username}
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
      <div className="dashboard-surface p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-6">
          <Skeleton className="h-20 w-20 shrink-0 rounded-full sm:h-24 sm:w-24" />
          <div className="w-full flex-1 space-y-3">
            <Skeleton className="h-6 w-40 sm:h-7 sm:w-48" />
            <Skeleton className="h-4 w-28 sm:w-32" />
            <Skeleton className="h-14 w-full sm:h-16" />
            <Skeleton className="h-9 w-full sm:w-32" />
          </div>
        </div>
      </div>
    );
  }

  const hasBio = profile.bio && profile.bio.trim() !== "";
  const hasGoal = profile.goal && profile.goal.trim() !== "";

  return (
    <div className="dashboard-surface relative overflow-hidden p-4 sm:p-6 lg:p-7">
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 lg:gap-8">
        <div className="flex items-center gap-4 sm:shrink-0">
          <div className="sm:hidden">
            <ProfileAvatar
              username={username}
              avatarUrl={profile.avatar}
              size={72}
            />
          </div>
          <div className="hidden sm:block lg:hidden">
            <ProfileAvatar
              username={username}
              avatarUrl={profile.avatar}
              size={96}
            />
          </div>
          <div className="hidden lg:block">
            <ProfileAvatar
              username={username}
              avatarUrl={profile.avatar}
              size={112}
            />
          </div>

          <div className="min-w-0 flex-1 text-left sm:hidden">
            <h2 className="truncate text-2xl font-bold leading-tight tracking-tight">
              {username ?? "Student"}
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-xs leading-none text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Member since {memberSince}</span>
            </div>
          </div>
        </div>

        <div className="min-w-0 w-full flex-1 text-left sm:py-1">
          <div className="hidden min-w-0 sm:block">
            <h2 className="truncate text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
              {username ?? "Student"}
            </h2>

            <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Member since {memberSince}</span>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-4 sm:mt-5 sm:max-w-3xl">
            {hasBio ? (
              <p className="text-sm font-medium leading-relaxed text-foreground/80 sm:text-base">
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
              className="dashboard-row mt-2 inline-flex max-w-full items-start gap-2 border-primary/20 bg-primary/5 px-4 py-2.5 text-sm sm:px-5 sm:py-3"
            >
              <Quote className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span className="font-semibold italic text-foreground/90">
                {profile.goal}
              </span>
            </motion.div>
          )}
        </div>

        <div className="flex shrink-0 items-center sm:self-start lg:self-center">
          <Button
            type="button"
            onClick={onEdit}
            className="w-full rounded-lg px-4 text-white shadow-md shadow-violet-500/20 sm:w-auto sm:px-5"
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
  );
}

/* -------------------------------------------------------------------------- */
/*                              Main Profile Page                             */
/* -------------------------------------------------------------------------- */

export function ProfilePage() {
  const user = useAppStore((s) => s.user);
  const initialCache = useMemo(
    () =>
      readPageCache<{
        profile: Profile;
        stats: Analytics["stats"] | null;
        memberSince: string;
      }>("profile", user?.id),
    [user?.id]
  );
  const [profile, setProfile] = useState<Profile | null>(
    () => initialCache?.profile ?? null
  );
  const [stats, setStats] = useState<Analytics["stats"] | null>(
    () => initialCache?.stats ?? null
  );
  const [memberSince, setMemberSince] = useState<string>(
    () => initialCache?.memberSince ?? "Recently"
  );
  const [loading, setLoading] = useState(() => !initialCache);
  const [error, setError] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    const cached = readPageCache<{
      profile: Profile;
      stats: Analytics["stats"] | null;
      memberSince: string;
    }>("profile", user?.id);
    if (cached) {
      setProfile(cached.profile);
      setStats(cached.stats);
      setMemberSince(cached.memberSince);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(false);
    try {
      const [meRes, analyticsRes] = await Promise.all([
        apiFetch<MeResponse>("/api/auth/me"),
        apiFetch<AnalyticsResponse>("/api/analytics").catch(() => null),
      ]);
      const nextMemberSince = meRes.user
        ? formatMemberSince(meRes.user.createdAt)
        : "Recently";
      const nextProfile = meRes.profile ?? DEFAULT_PROFILE;
      const nextStats = analyticsRes?.stats ?? null;
      setMemberSince(nextMemberSince);
      setProfile(nextProfile);
      setStats(nextStats);
      writePageCache("profile", user?.id, {
        profile: nextProfile,
        stats: nextStats,
        memberSince: nextMemberSince,
      });
    } catch (err) {
      handleError(err, "Failed to load profile");
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaved = (p: Profile, updatedUsername?: string) => {
    setProfile(p);
    useAppStore.getState().setView("profile");
    writePageCache("profile", user?.id, {
      profile: p,
      stats,
      memberSince,
    });
    if (user) {
      useAppStore.getState().setUser({
        ...user,
        username: updatedUsername ?? user.username,
        avatar: p.avatar || undefined,
      });
    }
  };

  const safeProfile = profile ?? DEFAULT_PROFILE;
  const studyStreak = stats?.studyStreak ?? safeProfile.studyStreak ?? 0;
  const totalFocusHours = stats?.totalFocusHours ?? 0;
  const targetHours = safeProfile.targetHours ?? 6;
  const semester = safeProfile.semester ?? 1;
  const currentUsername = user?.username ?? "";

  return (
    <PageTransition>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="dashboard-surface flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
          <div className="min-w-0">
            <div className="dashboard-chip dashboard-theme-glow-chip dashboard-theme-glow-text">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Your learning journey</span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Manage your personal info, study goal, and account details.
            </p>
          </div>
        </div>

        {error ? (
          <div className="dashboard-surface p-5 sm:p-6">
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
          </div>
        ) : (
          <div className="space-y-4">
            {/* Hero */}
            <div>
              <ProfileHero
                profile={safeProfile}
                username={currentUsername}
                memberSince={memberSince}
                loading={loading}
                onEdit={() => setEditOpen(true)}
              />
            </div>

            {/* Stats */}
            <div>
              <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:mb-3 sm:text-sm">
                Snapshot
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
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
              <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:mb-3 sm:text-sm">
                Academic Details
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
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


          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <EditProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        profile={safeProfile}
        username={currentUsername}
        onSaved={handleSaved}
      />
    </PageTransition>
  );
}

export default ProfilePage;
