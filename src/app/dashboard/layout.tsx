"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useAppStore } from "@/lib/store";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PageLoader } from "@/components/shared/feedback";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authLoading && !user) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname || "/dashboard")}`;
      router.replace(redirectUrl);
    }
  }, [authLoading, user, pathname, router]);

  if (authLoading && !user) {
    return <PageLoader />;
  }

  if (!user) {
    return <PageLoader />;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
