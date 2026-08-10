"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/shared/feedback";

const TodosPage = dynamic(
  () => import("@/components/dashboard/pages/todos").then((m) => m.TodosPage),
  { loading: () => <PageLoader /> }
);

export default function TodosRoutePage() {
  return <TodosPage />;
}
