-- User-to-user referral program
-- Distinct from the existing referrals table (which tracks client referrals)

-- Add referral_code to profiles
alter table profiles add column if not exists referral_code text unique;

-- Referral tracking table for the user acquisition program
create table if not exists user_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referred_email text not null,
  referred_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'signed_up', 'subscribed')),
  created_at timestamptz not null default now(),
  converted_at timestamptz
);

alter table user_referrals enable row level security;

-- Referrers can see their own referrals
create policy user_referrals_referrer_select on user_referrals
  for select using (auth.uid() = referrer_user_id);

-- Insert allowed from server-side (service role bypasses RLS)
-- For client-side inserts via the referral system, we allow authenticated users
create policy user_referrals_insert on user_referrals
  for insert with check (true);

-- Index for signup lookup
create index if not exists idx_user_referrals_referred_email on user_referrals(referred_email);
create index if not exists idx_user_referrals_referrer on user_referrals(referrer_user_id);
