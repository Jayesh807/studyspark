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

interface User {
  id: string;
  username: string;
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
      }),
    }
  )
);
