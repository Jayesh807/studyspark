"use client";

import { useEffect, useCallback, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { apiFetch, ApiError, handleError } from "@/lib/api";
import type { User, Profile } from "@/lib/types";

interface MeResponse {
  user: User | null;
  profile?: Profile | null;
}

interface AuthResponse {
  user: User;
}

/**
 * Module-level guard: the session check (`/api/auth/me`) should run at most
 * ONCE per page load. Multiple components calling `useAuth()` would otherwise
 * each fire their own check, and a stale in-flight request (sent before a
 * login/signup set the cookie) could resolve with `null` and clobber a
 * freshly-authenticated user. See worklog for the race-condition fix.
 */
let meCheckStarted = false;
let meCheckDone = false;

/** Hook that manages auth state and exposes login/signup/logout. */
export function useAuth() {
  const {
    user,
    isAuthenticated,
    authLoading,
    setUser,
    logout: storeLogout,
    setView,
  } = useAppStore();

  // Track whether this hook instance is still mounted
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Run the session check exactly once per page load
  useEffect(() => {
    if (meCheckStarted) return;
    meCheckStarted = true;

    (async () => {
      try {
        const data = await apiFetch<MeResponse>("/api/auth/me");
        if (!mountedRef.current) return;
        // Only apply the result if it provides a user, OR there is genuinely
        // no authenticated user yet (defensive: never clobber a user that a
        // concurrent login/signup may have just set).
        if (data.user) {
          setUser(data.user);
        } else if (!useAppStore.getState().user) {
          setUser(null);
        }
      } catch {
        if (!mountedRef.current) return;
        if (!useAppStore.getState().user) {
          setUser(null);
        }
      } finally {
        meCheckDone = true;
      }
    })();
  }, [setUser]);

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const data = await apiFetch<AuthResponse>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        });
        setUser(data.user);
        setView("dashboard");
        return data.user;
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        handleError(error, "Login failed");
        throw error;
      }
    },
    [setUser, setView]
  );

  const signup = useCallback(
    async (username: string, password: string) => {
      try {
        const data = await apiFetch<AuthResponse>("/api/auth/signup", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        });
        setUser(data.user);
        setView("dashboard");
        return data.user;
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        handleError(error, "Signup failed");
        throw error;
      }
    },
    [setUser, setView]
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    storeLogout();
    setView("landing");
  }, [storeLogout, setView]);

  return {
    user,
    isAuthenticated,
    authLoading,
    login,
    signup,
    logout,
  };
}

/** Exposed for testing / reset flows. */
export function _resetMeCheck() {
  meCheckStarted = false;
  meCheckDone = false;
}
