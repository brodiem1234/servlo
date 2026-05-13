-- Add Grow add-on tracking column to businesses table.
-- grow_addon_enabled is synced by the Stripe webhook (customer.subscription.updated)
-- and by the billing API routes (POST/DELETE /api/billing/add-grow).
alter table businesses
  add column if not exists grow_addon_enabled bool not null default false;
