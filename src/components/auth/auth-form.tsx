"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Sparkles,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  User,
  Lock,
  KeyRound,
  Mail,
  ShieldCheck,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useAppStore, type AppView } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { ApiError, apiFetch } from "@/lib/api";
import type { Profile, User as UserType } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

function GoogleGIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
};

type GoogleTokenClient = {
  requestAccessToken: () => void;
};

type GoogleAccounts = {
  id: {
    initialize: (config: {
      client_id: string;
      callback: (response: GoogleCredentialResponse) => void;
    }) => void;
  };
  oauth2: {
    initTokenClient: (config: {
      client_id: string;
      scope: string;
      callback: (response: GoogleTokenResponse) => void;
    }) => GoogleTokenClient;
  };
};

declare global {
  interface Window {
    google?: {
      accounts?: GoogleAccounts;
    };
  }
}

function GoogleAuthButton({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const setUser = useAppStore((s) => s.setUser);
  const setView = useAppStore((s) => s.setView);
  const tokenClientRef = useRef<GoogleTokenClient | null>(null);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [clientId, setClientId] = useState("");
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    let cancelled = false;

    const loadStatus = async () => {
      try {
        const status = await apiFetch<{
          configured: boolean;
          clientId: string | null;
        }>("/api/auth/google/status");

        if (cancelled) return;
        setConfigured(status.configured);
        setClientId(status.clientId || "");
      } catch {
        if (!cancelled) {
          setConfigured(false);
        }
      }
    };

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  const finishGoogleSignIn = async (accessToken: string) => {
    setLoading(true);
    try {
      const data = await apiFetch<{
        user?: UserType;
        profile?: Profile | null;
        requiresUsername?: boolean;
      }>("/api/auth/google/access-token", {
        method: "POST",
        body: JSON.stringify({ accessToken }),
      });

      if (data.requiresUsername) {
        router.push("/google-username");
        return;
      }

      if (data.user) {
        setUser({ ...data.user, avatar: data.profile?.avatar || undefined });
        setView("dashboard");
        toast.success("Welcome back!");
        router.push("/");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not complete Google Sign-In."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToken = (response: GoogleTokenResponse) => {
    if (response.error || !response.access_token) {
      toast.error("Google did not return an access token. Please try again.");
      return;
    }

    void finishGoogleSignIn(response.access_token);
  };

  useEffect(() => {
    if (!configured || !clientId) {
      return;
    }

    const setupTokenClient = () => {
      if (!window.google?.accounts?.oauth2) {
        return;
      }

      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "openid email profile",
        callback: handleToken,
      });
    };

    if (window.google?.accounts?.oauth2) {
      setupTokenClient();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", setupTokenClient, { once: true });
      return () => existingScript.removeEventListener("load", setupTokenClient);
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", setupTokenClient, { once: true });
    document.head.appendChild(script);

    return () => script.removeEventListener("load", setupTokenClient);
  }, [clientId, configured]);

  const startGoogleAuth = () => {
    if (!configured) {
      toast.error(
        "Google Sign-In is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env, then restart the server."
      );
      return;
    }

    if (!tokenClientRef.current) {
      toast.error("Google Sign-In is still loading. Please try again.");
      return;
    }

    setLoading(true);
    tokenClientRef.current.requestAccessToken();
  };

  if (configured === false) {
    return (
      <button
        type="button"
        onClick={() =>
          toast.error(
            "Google Sign-In is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env, then restart the server."
          )
        }
        className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-transparent bg-zinc-100 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        <GoogleGIcon className="size-5" />
        Continue with Google
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={configured === null || loading}
      onClick={startGoogleAuth}
      className={cn(
        "flex h-11 w-full items-center justify-center gap-3 rounded-lg text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-80",
        isDark
          ? "bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
          : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
      )}
    >
      {loading || configured === null ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <GoogleGIcon className="size-5" />
      )}
      {loading ? "Checking Google..." : "Continue with Google"}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Schemas                                                             */
/* ------------------------------------------------------------------ */

const emailSchema = z
  .string()
  .trim()
  .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
    message: "Enter a valid email address",
  });

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
      .refine(
        (val) => /^[a-zA-Z0-9_]+$/.test(val),
        "Only letters, numbers, and underscores allowed"
      ),
    email: emailSchema,
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
type SignupValues = z.infer<typeof signupSchema>;

type ForgotStep = "email" | "otp" | "password" | "done";

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

function LoginForm({
  onAuthenticated,
  onForgotPassword,
}: AuthModeFormProps & { onForgotPassword: () => void }) {
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

      <div className="flex items-center justify-between gap-3 pt-1">
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
          onClick={onForgotPassword}
          className="text-sm font-semibold text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-300 dark:hover:text-violet-200"
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
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: SignupValues) => {
    setSubmitting(true);
    try {
      await signup(values.username, values.email, values.password);
      toast.success("Account created. Please sign in when you're ready.");
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

      <div className="space-y-1.5">
        <Label htmlFor="signup-email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className={cn(
              "h-11 rounded-xl pl-9",
              errors.email &&
              "border-destructive/60 focus-visible:ring-destructive/30"
            )}
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-xs font-medium text-destructive">
            {errors.email.message}
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

function ForgotPasswordForm({
  onBack,
}: {
  onBack: () => void;
}) {
  const [step, setStep] = useState<ForgotStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const requestOtp = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch<{ message: string }>("/api/auth/forgot-password/request", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      toast.success("If that email is linked, an OTP has been sent.");
      setStep("otp");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send OTP");
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const data = await apiFetch<{ resetToken: string }>(
        "/api/auth/forgot-password/verify",
        {
          method: "POST",
          body: JSON.stringify({ email, otp }),
        }
      );
      setResetToken(data.resetToken);
      toast.success("OTP verified.");
      setStep("password");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid OTP");
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch<{ success: boolean }>("/api/auth/forgot-password/reset", {
        method: "POST",
        body: JSON.stringify({ resetToken, password, confirmPassword }),
      });
      toast.success("Password reset successfully. Please sign in.");
      setStep("done");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not reset password"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submitLabel =
    step === "email"
      ? "Send OTP"
      : step === "otp"
        ? "Verify OTP"
        : "Set new password";

  return (
    <motion.div
      key="forgot-password-form"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
    >
      {step === "done" ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-300">
            <CheckCircle2 className="size-7" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Password updated</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              You can now sign in with your new password.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="h-11 w-full rounded-xl bg-violet-600 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
          >
            Back to login
          </button>
        </div>
      ) : (
        <form
          onSubmit={
            step === "email"
              ? requestOtp
              : step === "otp"
                ? verifyOtp
                : resetPassword
          }
          className="space-y-4"
          noValidate
        >
          {step === "email" && (
            <div className="space-y-1.5">
              <Label htmlFor="reset-email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-11 rounded-xl pl-9"
                  required
                />
              </div>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-1.5">
              <Label htmlFor="reset-otp">OTP</Label>
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reset-otp"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="6-digit code"
                  autoComplete="one-time-code"
                  className="h-11 rounded-xl pl-9"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                }}
                className="text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-300"
              >
                Use a different email
              </button>
            </div>
          )}

          {step === "password" && (
            <>
              <SimplePasswordInput
                id="reset-password"
                label="New Password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
              />
              <SimplePasswordInput
                id="reset-confirm-password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
              />
            </>
          )}

          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ scale: submitting ? 1 : 1.015 }}
            whileTap={{ scale: submitting ? 1 : 0.985 }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 disabled:cursor-not-allowed disabled:opacity-80"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? "Please wait..." : submitLabel}
          </motion.button>

          <button
            type="button"
            onClick={onBack}
            className="w-full text-center text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to login
          </button>
        </form>
      )}
    </motion.div>
  );
}

function SimplePasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="h-11 rounded-xl pl-9 pr-10"
          required
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
    </div>
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
  const searchParams = useSearchParams();
  const [forgotPassword, setForgotPassword] = useState(false);
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
    setForgotPassword(false);
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

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) return;

    const messages: Record<string, string> = {
      google_cancelled: "Google sign-in was cancelled.",
      google_config: "Google sign-in is not configured yet.",
      google_email_exists:
        "That email already has a password account. Sign in with your password first.",
      google_failed: "Google sign-in failed. Please try again.",
      google_state: "Google sign-in expired. Please try again.",
    };

    toast.error(messages[error] ?? "Google sign-in could not be completed.");
  }, [searchParams]);

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
            {forgotPassword
              ? "Reset your password"
              : mode === "login"
                ? "Welcome back"
                : "Create your account"}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {forgotPassword
              ? "Verify your email, enter the OTP, then choose a new password"
              : mode === "login"
                ? "Sign in to continue to your dashboard"
                : "Start studying smarter in under a minute"}
          </p>
        </div>

        {/* Segmented control */}
        {!forgotPassword && (
          <div className="mb-6">
            <SegmentedControl
              mode={mode}
              onChange={(m) => go(m === "login" ? "login" : "signup")}
            />
          </div>
        )}

        {/* Form with crossfade */}
        {!forgotPassword && (
          <div className="mb-5 space-y-4">
            <GoogleAuthButton mode={mode} />
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border/70" />
              <span>or continue with username</span>
              <span className="h-px flex-1 bg-border/70" />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {forgotPassword ? (
            <ForgotPasswordForm
              key="forgot-password"
              onBack={() => {
                setForgotPassword(false);
                go("login");
              }}
            />
          ) : mode === "login" ? (
            <LoginForm
              key="login"
              onAuthenticated={handleAuthenticated}
              onForgotPassword={() => setForgotPassword(true)}
            />
          ) : (
            <SignupForm key="signup" onAuthenticated={handleAuthenticated} />
          )}
        </AnimatePresence>

        {/* Switch-mode link */}
        {!forgotPassword && (
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
        )}
      </motion.div>
    </div>
  );
}
