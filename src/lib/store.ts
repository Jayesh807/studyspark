"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type AppView =
  | "landing"
  | "login"
  | "signup"
  | "dashboard"
  | "profile"
  | "analytics"
  | "todos"
  | "calendar"
  | "subjects"
  | "exams"
  | "focus"
  | "planner"
  | "settings";

export type AccentColor = "277" | "300" | "162" | "16" | "200" | "70";
export type FocusTimerMode = "focus" | "short" | "long";

const DEFAULT_FOCUS_DURATIONS: Record<FocusTimerMode, number> = {
  focus: 25,
  short: 5,
  long: 15,
};

interface User {
  id: string;
  username: string;
  email?: string | null;
  avatar?: string;
}

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;

  // Navigation
  currentView: AppView;
  sidebarOpen: boolean;
  mobileSidebarOpen: boolean;

  // Settings
  accentColor: AccentColor;
  notifications: boolean;
  reduceMotion: boolean;
  soundEnabled: boolean;
  notifEnabled: boolean;

  // Focus timer
  focusTimerMode: FocusTimerMode;
  focusTimerDurations: Record<FocusTimerMode, number>;
  focusTimerRemaining: number;
  focusTimerRunning: boolean;
  focusTimerEndsAt: number | null;
  focusTimerSubject: string;
  focusTimerAutoBreak: boolean;
  focusTimerCompletedCount: number;
  focusTimerCycleId: number;
  focusTimerHandledCycleId: number | null;

  // Actions
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setView: (view: AppView) => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setAccentColor: (color: AccentColor) => void;
  setNotifications: (on: boolean) => void;
  setReduceMotion: (on: boolean) => void;
  setSoundEnabled: (on: boolean) => void;
  setNotifEnabled: (on: boolean) => void;
  syncFocusTimer: () => void;
  startFocusTimer: () => void;
  pauseFocusTimer: () => void;
  resetFocusTimer: () => void;
  skipFocusTimer: () => void;
  switchFocusTimerMode: (mode: FocusTimerMode, autoStart?: boolean) => void;
  setFocusTimerDuration: (minutes: number) => void;
  setFocusTimerSubject: (subject: string) => void;
  setFocusTimerAutoBreak: (on: boolean) => void;
  incrementFocusTimerCompletedCount: () => void;
  markFocusTimerCompletionHandled: () => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      authLoading: true,

      currentView: "landing",
      sidebarOpen: true,
      mobileSidebarOpen: false,

      accentColor: "277",
      notifications: true,
      reduceMotion: true,
      soundEnabled: true,
      notifEnabled: false,

      focusTimerMode: "focus",
      focusTimerDurations: DEFAULT_FOCUS_DURATIONS,
      focusTimerRemaining: DEFAULT_FOCUS_DURATIONS.focus * 60,
      focusTimerRunning: false,
      focusTimerEndsAt: null,
      focusTimerSubject: "",
      focusTimerAutoBreak: true,
      focusTimerCompletedCount: 0,
      focusTimerCycleId: 0,
      focusTimerHandledCycleId: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          authLoading: false,
        }),
      setAuthLoading: (loading) => set({ authLoading: loading }),
      setView: (view) => set({ currentView: view, mobileSidebarOpen: false }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      setAccentColor: (color) => set({ accentColor: color }),
      setNotifications: (on) => set({ notifications: on }),
      setReduceMotion: (on) => set({ reduceMotion: on }),
      setSoundEnabled: (on) => set({ soundEnabled: on }),
      setNotifEnabled: (on) => set({ notifEnabled: on }),
      syncFocusTimer: () =>
        set((state) => {
          if (!state.focusTimerRunning || !state.focusTimerEndsAt) return {};
          const remaining = Math.max(
            0,
            Math.ceil((state.focusTimerEndsAt - Date.now()) / 1000)
          );
          return {
            focusTimerRemaining: remaining,
            focusTimerRunning: remaining > 0,
            focusTimerEndsAt: remaining > 0 ? state.focusTimerEndsAt : null,
          };
        }),
      startFocusTimer: () =>
        set((state) => {
          const durationSeconds =
            state.focusTimerDurations[state.focusTimerMode] * 60;
          const remaining =
            state.focusTimerRemaining === 0
              ? durationSeconds
              : state.focusTimerRemaining;
          return {
            focusTimerRemaining: remaining,
            focusTimerRunning: true,
            focusTimerEndsAt: Date.now() + remaining * 1000,
            ...(state.focusTimerRemaining === 0
              ? {
                  focusTimerCycleId: state.focusTimerCycleId + 1,
                  focusTimerHandledCycleId: null,
                }
              : {}),
          };
        }),
      pauseFocusTimer: () =>
        set((state) => {
          const remaining =
            state.focusTimerRunning && state.focusTimerEndsAt
              ? Math.max(
                  0,
                  Math.ceil((state.focusTimerEndsAt - Date.now()) / 1000)
                )
              : state.focusTimerRemaining;
          return {
            focusTimerRemaining: remaining,
            focusTimerRunning: false,
            focusTimerEndsAt: null,
          };
        }),
      resetFocusTimer: () =>
        set((state) => ({
          focusTimerRemaining:
            state.focusTimerDurations[state.focusTimerMode] * 60,
          focusTimerRunning: false,
          focusTimerEndsAt: null,
          focusTimerCycleId: state.focusTimerCycleId + 1,
          focusTimerHandledCycleId: null,
        })),
      skipFocusTimer: () =>
        set({
          focusTimerRemaining: 0,
          focusTimerRunning: false,
          focusTimerEndsAt: null,
        }),
      switchFocusTimerMode: (mode, autoStart = false) =>
        set((state) => {
          const remaining = state.focusTimerDurations[mode] * 60;
          return {
            focusTimerMode: mode,
            focusTimerRemaining: remaining,
            focusTimerRunning: autoStart,
            focusTimerEndsAt: autoStart ? Date.now() + remaining * 1000 : null,
            focusTimerCycleId: state.focusTimerCycleId + 1,
            focusTimerHandledCycleId: null,
          };
        }),
      setFocusTimerDuration: (minutes) =>
        set((state) => {
          const safe = Math.max(1, Math.min(180, Math.round(minutes)));
          const durations = {
            ...state.focusTimerDurations,
            [state.focusTimerMode]: safe,
          };
          return {
            focusTimerDurations: durations,
            ...(!state.focusTimerRunning
              ? {
                  focusTimerRemaining: safe * 60,
                  focusTimerCycleId: state.focusTimerCycleId + 1,
                  focusTimerHandledCycleId: null,
                }
              : {}),
          };
        }),
      setFocusTimerSubject: (subject) => set({ focusTimerSubject: subject }),
      setFocusTimerAutoBreak: (on) => set({ focusTimerAutoBreak: on }),
      incrementFocusTimerCompletedCount: () =>
        set((state) => ({
          focusTimerCompletedCount: state.focusTimerCompletedCount + 1,
        })),
      markFocusTimerCompletionHandled: () =>
        set((state) => ({
          focusTimerHandledCycleId: state.focusTimerCycleId,
        })),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          currentView: "landing",
        }),
    }),
    {
      name: "studyspark-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        notifications: state.notifications,
        soundEnabled: state.soundEnabled,
        notifEnabled: state.notifEnabled,
        sidebarOpen: state.sidebarOpen,
        focusTimerMode: state.focusTimerMode,
        focusTimerDurations: state.focusTimerDurations,
        focusTimerRemaining: state.focusTimerRemaining,
        focusTimerRunning: state.focusTimerRunning,
        focusTimerEndsAt: state.focusTimerEndsAt,
        focusTimerSubject: state.focusTimerSubject,
        focusTimerAutoBreak: state.focusTimerAutoBreak,
        focusTimerCompletedCount: state.focusTimerCompletedCount,
        focusTimerCycleId: state.focusTimerCycleId,
        focusTimerHandledCycleId: state.focusTimerHandledCycleId,
      }),
    }
  )
);
