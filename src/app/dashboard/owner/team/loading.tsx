import { DashboardPageSkeleton } from "@/components/dashboard/page-skeleton";

export default function TeamLoading() {
  return <DashboardPageSkeleton cards={3} rows={5} showHeader />;
}
