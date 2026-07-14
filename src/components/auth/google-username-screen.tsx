"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, User } from "lucide-react";
import { toast } from "sonner";

import { ApiError, apiFetch } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import type { Profile, User as UserType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AuthLeftPanel } from "@/components/auth/auth-left-panel";
import { PageTransition } from "@/components/shared/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CompleteUsernameResponse {
  user: UserType;
  profile?: Profile | null;
}

export function GoogleUsernameScreen() {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);
  const setView = useAppStore((s) => s.setView);
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const completeUsername = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data = await apiFetch<CompleteUsernameResponse>(
        "/api/auth/google/complete-username",
        {
          method: "POST",
          body: JSON.stringify({ username }),
        }
      );

      setUser({ ...data.user, avatar: data.profile?.avatar || undefined });
      setView("dashboard");
      toast.success("Google account connected. Welcome to StudySpark!");
      router.push("/");
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Could not complete Google sign-up.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition className="min-h-screen w-full">
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        <AuthLeftPanel />

        <div className="auth-mesh relative flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_30%,rgba(167,139,250,0.12),transparent_55%)]"
          />

          <div className="w-full max-w-md">
            <div className="glass-strong rounded-3xl p-8 shadow-2xl ring-1 ring-border/40 sm:p-10">
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg">
                  <Sparkles className="size-6" />
                </div>
                <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                  Create your username
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Choose a unique StudySpark username to finish Google sign-up.
                </p>
              </div>

              <form onSubmit={completeUsername} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="google-username">Username</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="google-username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="3-20 chars, letters/numbers/_"
                      autoComplete="username"
                      className={cn(
                        "h-11 rounded-xl pl-9",
                        error &&
                          "border-destructive/60 focus-visible:ring-destructive/30"
                      )}
                    />
                  </div>
                  {error && (
                    <p className="text-xs font-medium text-destructive">
                      {error}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 hover:shadow-xl hover:shadow-violet-600/30"
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  {submitting ? "Creating username..." : "Continue to dashboard"}
                </Button>

                <button
                  type="button"
                  onClick={() => router.push("/signup")}
                  className="w-full text-center text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Back to sign up
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
