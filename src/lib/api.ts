"use client";

import { toast } from "sonner";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Guard to prevent multiple 401 toasts / redirects firing simultaneously
let sessionExpiredHandled = false;

/**
 * When a protected API call returns 401, the user's session is invalid or
 * expired. Instead of showing "Unauthorized" toast for every failed call
 * (which floods the UI), we show a single friendly message and redirect to
 * the login screen. The actual state reset is handled by the caller via
 * the thrown ApiError.
 */
function handleSessionExpired() {
  if (sessionExpiredHandled) return;
  sessionExpiredHandled = true;
  toast.error("Your session has expired. Please sign in again.", {
    duration: 4000,
  });
  // Dispatch a global event so the app shell can log out + redirect to login
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("studyspark:session-expired"));
  }
  // Reset the guard after a delay so a fresh login can show errors normally
  setTimeout(() => {
    sessionExpiredHandled = false;
  }, 3000);
}

export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // 401 on a protected endpoint (not /auth/me which now returns 200)
      // means the session is stale — handle gracefully
      if (res.status === 401 && !url.includes("/api/auth/")) {
        handleSessionExpired();
      }
      const message =
        (data && typeof data === "object" && "error" in data
          ? String((data as Record<string, unknown>).error)
          : null) ?? "Something went wrong";
      throw new ApiError(message, res.status);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Network error
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ApiError(
        "Network error. Please check your connection.",
        0
      );
    }
    throw error;
  }
}

export function handleError(error: unknown, fallback = "Something went wrong") {
  if (error instanceof ApiError) {
    // Don't show toast for 401 — handleSessionExpired already showed one
    if (error.status === 401) return;
    toast.error(error.message);
    return;
  }
  if (error instanceof Error) {
    toast.error(error.message || fallback);
    return;
  }
  toast.error(fallback);
}
