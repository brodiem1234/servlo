-- AI usage tracking and per-plan limits
-- Migration: 20260509100000_ai_usage_and_limits.sql

-- ai_usage_log table: tracks every AI call with token counts and cost
create table if not exists ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid,
  endpoint text not null,
  model text not null,
  prompt_tokens integer default 0,
  completion_tokens integer default 0,
  cost_aud_cents integer default 0,
  created_at timestamptz default now()
);
create index if not exists idx_ai_usage_log_user_created on ai_usage_log(user_id, created_at);

-- RLS on ai_usage_log: users can only see their own
alter table ai_usage_log enable row level security;
drop policy if exists ai_usage_log_select on ai_usage_log;
drop policy if exists ai_usage_log_insert on ai_usage_log;
create policy ai_usage_log_select on ai_usage_log for select using (auth.uid() = user_id);
create policy ai_usage_log_insert on ai_usage_log for insert with check (auth.uid() = user_id);

-- plan_ai_limits: defines how many AI calls each plan gets per month
create table if not exists plan_ai_limits (
  plan text primary key,
  monthly_limit integer not null,
  is_soft_cap boolean default false
);

insert into plan_ai_limits values
  ('free',       0,    false),
  ('trial',      10,   true),   -- trial gets 10 soft-cap so they can try AI
  ('solo',       50,   false),
  ('team',       200,  false),
  ('business',   500,  false),
  ('enterprise', 2000, true)
on conflict (plan) do nothing;
