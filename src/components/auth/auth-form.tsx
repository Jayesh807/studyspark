"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  User,
  Lock,
  KeyRound,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useAppStore, type AppView } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

/* ------------------------------------------------------------------ */
/* Schemas                                                             */
/* ------------------------------------------------------------------ */

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
type LoginValues = z.infer<typeof loginSchema>;

const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Only letters, numbers, and underscores allowed"
      ),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
type SignupValues = z.infer<typeof signupSchema>;

/* ------------------------------------------------------------------ */
/* Segmented control                                                   */
/* ------------------------------------------------------------------ */

interface SegmentedProps {
  mode: "login" | "signup";
  onChange: (mode: "login" | "signup") => void;
}

function SegmentedControl({ mode, onChange }: SegmentedProps) {
  const options: { value: "login" | "signup"; label: string }[] = [
    { value: "login", label: "Login" },
    { value: "signup", label: "Sign Up" },
  ];
  return (
    <div className="relative grid grid-cols-2 rounded-2xl bg-muted/60 p-1 ring-1 ring-border/60">
      {options.map((opt) => {
        const active = mode === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative z-10 rounded-xl py-2.5 text-sm font-medium transition-colors duration-200",
              active
                ? "text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={active}
          >
            {active && (
              <motion.span
                layoutId="auth-segmented-pill"
                className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-md"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reusable password field with show/hide                              */
/* ------------------------------------------------------------------ */

interface PasswordFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  registration: UseFormRegisterReturn;
  error?: string;
  autoComplete: string;
  icon?: LucideIcon;
}

function PasswordField({
  id,
  label,
  placeholder,
  registration,
  error,
  autoComplete,
  icon: Icon = Lock,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={cn(
            "h-11 rounded-xl pl-9 pr-10",
            error && "border-destructive/60 focus-visible:ring-destructive/30"
          )}
          {...registration}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          aria-label={show ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Login form                                                          */
/* ------------------------------------------------------------------ */

interface AuthModeFormProps {
  onAuthenticated: () => void;
}

function LoginForm({ onAuthenticated }: AuthModeFormProps) {
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [remember, setRemember] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setSubmitting(true);
    try {
      await login(values.username, values.password);
      if (remember) {
        try {
          localStorage.setItem("studyspark_remember", values.username);
        } catch {
          /* ignore */
        }
      } else {
        try {
          localStorage.removeItem("studyspark_remember");
        } catch {
          /* ignore */
        }
      }
      toast.success("Welcome back!");
      onAuthenticated();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else if (err instanceof Error) {
        toast.error(err.message || "Login failed");
      } else {
        toast.error("Login failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.form
      key="login-form"
      onSubmit={handleSubmit(onSubmit)}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
      noValidate
    >
      <div className="space-y-1.5">
        <Label htmlFor="login-username">Username</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="login-username"
            placeholder="your_username"
            autoComplete="username"
            className={cn(
              "h-11 rounded-xl pl-9",
              errors.username &&
                "border-destructive/60 focus-visible:ring-destructive/30"
            )}
            {...register("username")}
          />
        </div>
        {errors.username && (
          <p className="text-xs font-medium text-destructive">
            {errors.username.message}
          </p>
        )}
      </div>

      <PasswordField
        id="login-password"
        label="Password"
        placeholder="••••••••"
        autoComplete="current-password"
        registration={register("password")}
        error={errors.password?.message}
      />

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={remember}
            onCheckedChange={(v) => setRemember(v === true)}
          />
          <Label
            htmlFor="remember"
            className="cursor-pointer text-sm text-muted-foreground"
          >
            Remember me
          </Label>
        </div>
        <button
          type="button"
          className="text-sm font-medium text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-300 dark:hover:text-violet-200"
        >
          Forgot password?
        </button>
      </div>

      <SubmitButton submitting={submitting} mode="login" />
    </motion.form>
  );
}

/* ------------------------------------------------------------------ */
/* Signup form                                                         */
/* ------------------------------------------------------------------ */

function SignupForm({ onAuthenticated }: AuthModeFormProps) {
  const { signup } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { username: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: SignupValues) => {
    setSubmitting(true);
    try {
      await signup(values.username, values.password);
      toast.success("Account created! Welcome to StudySpark.");
      onAuthenticated();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else if (err instanceof Error) {
        toast.error(err.message || "Sign up failed");
      } else {
        toast.error("Sign up failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.form
      key="signup-form"
      onSubmit={handleSubmit(onSubmit)}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
      noValidate
    >
      <div className="space-y-1.5">
        <Label htmlFor="signup-username">Username</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-username"
            placeholder="3-20 chars, letters/numbers/_"
            autoComplete="username"
            className={cn(
              "h-11 rounded-xl pl-9",
              errors.username &&
                "border-destructive/60 focus-visible:ring-destructive/30"
            )}
            {...register("username")}
          />
        </div>
        {errors.username && (
          <p className="text-xs font-medium text-destructive">
            {errors.username.message}
          </p>
        )}
      </div>

      <PasswordField
        id="signup-password"
        label="Password"
        placeholder="At least 6 characters"
        autoComplete="new-password"
        registration={register("password")}
        error={errors.password?.message}
      />

      <PasswordField
        id="signup-confirm"
        label="Confirm Password"
        placeholder="Re-enter your password"
        autoComplete="new-password"
        icon={KeyRound}
        registration={register("confirmPassword")}
        error={errors.confirmPassword?.message}
      />

      <div className="pt-1">
        <SubmitButton submitting={submitting} mode="signup" />
      </div>
    </motion.form>
  );
}

/* ------------------------------------------------------------------ */
/* Submit button (gradient + spinner)                                  */
/* ------------------------------------------------------------------ */

function SubmitButton({
  submitting,
  mode,
}: {
  submitting: boolean;
  mode: "login" | "signup";
}) {
  return (
    <motion.button
      type="submit"
      disabled={submitting}
      whileHover={{ scale: submitting ? 1 : 1.015 }}
      whileTap={{ scale: submitting ? 1 : 0.985 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-xl hover:shadow-violet-600/30 disabled:cursor-not-allowed disabled:opacity-80"
    >
      {/* Sheen sweep on hover */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      {submitting ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          <span>{mode === "login" ? "Signing in..." : "Creating account..."}</span>
        </>
      ) : (
        <span>{mode === "login" ? "Sign in" : "Create account"}</span>
      )}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* Main form card                                                      */
/* ------------------------------------------------------------------ */

interface AuthFormProps {
  initialMode?: "login" | "signup";
}

export function AuthForm({ initialMode = "login" }: AuthFormProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentView = useAppStore((s) => s.currentView);
  const setView = useAppStore((s) => s.setView);

  const routeMode =
    pathname === "/signup" ? "signup" : pathname === "/login" ? "login" : null;

  const mode: "login" | "signup" =
    routeMode ??
    (currentView === "signup"
      ? "signup"
      : currentView === "login"
        ? "login"
        : initialMode);

  const go = (v: AppView) => {
    setView(v);
    if (v === "login" || v === "signup") {
      if (pathname !== "/" && pathname !== `/${v}`) {
        router.push(`/${v}`);
      }
      return;
    }
    if (v === "landing" && pathname !== "/") {
      router.push("/");
    }
  };

  const handleAuthenticated = () => {
    if (pathname !== "/") {
      router.push("/");
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Back to home */}
      <button
        type="button"
        onClick={() => go("landing")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to home
      </button>

      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong rounded-3xl p-8 sm:p-10 shadow-2xl ring-1 ring-border/40"
      >
        {/* Mobile logo */}
        <div className="mb-6 flex flex-col items-center text-center lg:hidden">
          <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg">
            <Sparkles className="size-6" />
          </div>
          <span className="mt-2 text-xl font-semibold tracking-tight">
            StudySpark
          </span>
        </div>

        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to continue to your dashboard"
              : "Start studying smarter in under a minute"}
          </p>
        </div>

        {/* Segmented control */}
        <div className="mb-6">
          <SegmentedControl
            mode={mode}
            onChange={(m) => go(m === "login" ? "login" : "signup")}
          />
        </div>

        {/* Form with crossfade */}
        <AnimatePresence mode="wait" initial={false}>
          {mode === "login" ? (
            <LoginForm key="login" onAuthenticated={handleAuthenticated} />
          ) : (
            <SignupForm key="signup" onAuthenticated={handleAuthenticated} />
          )}
        </AnimatePresence>

        {/* Switch-mode link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => go("signup")}
                className="font-semibold text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-300 dark:hover:text-violet-200"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => go("login")}
                className="font-semibold text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-300 dark:hover:text-violet-200"
              >
                Login
              </button>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}
