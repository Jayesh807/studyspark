import { PageLoader } from "@/components/shared/feedback";

export default function DashboardLoading() {
  return (
    <div className="flex h-[70vh] w-full items-center justify-center">
      <PageLoader />
    </div>
  );
}
