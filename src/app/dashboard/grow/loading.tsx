import { DashboardPageSkeleton } from "@/components/dashboard/page-skeleton";

export default function GrowLoading() {
  return <DashboardPageSkeleton cards={4} rows={5} showHeader />;
}
