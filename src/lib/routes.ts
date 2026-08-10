import { useAppStore, type AppView } from "./store";

export const VIEW_TO_ROUTE: Record<AppView, string> = {
  landing: "/",
  login: "/login",
  signup: "/signup",
  dashboard: "/dashboard",
  todos: "/dashboard/todos",
  calendar: "/dashboard/calendar",
  planner: "/dashboard/planner",
  subjects: "/dashboard/subjects",
  exams: "/dashboard/exams",
  revision: "/dashboard/revision",
  focus: "/dashboard/focus",
  typing: "/dashboard/typing",
  analytics: "/dashboard/analytics",
  settings: "/dashboard/settings",
  studySearch: "/dashboard/sparks-ai",
  profile: "/dashboard/profile",
};

export const ROUTE_TO_VIEW: Record<string, AppView> = {
  "/": "landing",
  "/login": "login",
  "/signup": "signup",
  "/dashboard": "dashboard",
  "/dashboard/todos": "todos",
  "/dashboard/calendar": "calendar",
  "/dashboard/planner": "planner",
  "/dashboard/subjects": "subjects",
  "/dashboard/exams": "exams",
  "/dashboard/revision": "revision",
  "/dashboard/focus": "focus",
  "/dashboard/typing": "typing",
  "/dashboard/analytics": "analytics",
  "/dashboard/settings": "settings",
  "/dashboard/sparks-ai": "studySearch",
  "/dashboard/profile": "profile",
};

export function getRouteForView(view: AppView): string {
  return VIEW_TO_ROUTE[view] || "/dashboard";
}

export function getViewForRoute(pathname: string): AppView {
  return ROUTE_TO_VIEW[pathname] || "dashboard";
}

export function navigateToView(view: AppView) {
  useAppStore.getState().setView(view);
  const route = getRouteForView(view);
  if (typeof window !== "undefined" && window.location.pathname !== route) {
    window.history.pushState({ view }, "", route);
  }
}
