import { DashboardPageSkeleton } from "@/components/dashboard/page-skeleton";

export default function PipelineLoading() {
  return <DashboardPageSkeleton cards={4} rows={6} showHeader />;
}
