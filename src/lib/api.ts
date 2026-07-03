"use client";

import { toast } from "sonner";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
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
    toast.error(error.message);
    return;
  }
  if (error instanceof Error) {
    toast.error(error.message || fallback);
    return;
  }
  toast.error(fallback);
}
