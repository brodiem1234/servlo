-- Audit log for compliance, security review, and dispute resolution
-- Migration: 20260509100200_audit_log.sql

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  business_id uuid,
  table_name text not null,
  record_id uuid,
  action text not null check (action in ('created','updated','deleted','exported','viewed')),
  changed_fields jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists idx_audit_log_business_created on audit_log(business_id, created_at);
create index if not exists idx_audit_log_user on audit_log(user_id, created_at);

alter table audit_log enable row level security;

-- Owners can read audit log entries for their business
drop policy if exists audit_log_owner_select on audit_log;
create policy audit_log_owner_select on audit_log for select using (
  business_id in (select id from businesses where owner_id = auth.uid())
);

-- Insert allowed for all (server-side inserts via service role bypass RLS anyway)
-- We use check(true) to allow application-level inserts without service role
drop policy if exists audit_log_insert on audit_log;
create policy audit_log_insert on audit_log for insert with check (true);
