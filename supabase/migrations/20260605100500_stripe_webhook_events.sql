-- Idempotency log for Stripe webhooks.
-- The webhook route inserts event IDs here before running side effects so
-- Stripe retries do not resend emails or repeat billing mutations.
create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;
