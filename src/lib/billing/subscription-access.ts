export type DashboardSubscriptionFields = {
  subscription_status?: string | null;
};

export function hasActivePaidSubscription(profile: DashboardSubscriptionFields | null | undefined): boolean {
  return String(profile?.subscription_status ?? "").toLowerCase() === "active";
}
