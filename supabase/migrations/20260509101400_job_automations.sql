-- Job stage automations config
-- Migration: 20260509101400_job_automations.sql

create table if not exists job_automations (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  trigger_status  text not null, -- job status that fires the automation
  action_type     text not null check (action_type in ('email', 'sms')),
  email_subject   text,
  message_body    text not null default '',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

alter table job_automations enable row level security;

create policy job_automations_owner_select on job_automations
  for select using (auth.uid() = owner_id);

create policy job_automations_owner_insert on job_automations
  for insert with check (auth.uid() = owner_id);

create policy job_automations_owner_update on job_automations
  for update using (auth.uid() = owner_id);

create policy job_automations_owner_delete on job_automations
  for delete using (auth.uid() = owner_id);

create index if not exists idx_job_automations_owner on job_automations (owner_id, trigger_status);

-- Automation execution log
create table if not exists job_automation_log (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  automation_id   uuid not null references job_automations(id) on delete cascade,
  job_id          uuid not null references jobs(id) on delete cascade,
  action_type     text not null,
  recipient       text,
  status          text not null default 'sent',
  created_at      timestamptz not null default now()
);

alter table job_automation_log enable row level security;

create policy job_automation_log_owner_select on job_automation_log
  for select using (auth.uid() = owner_id);

create policy job_automation_log_owner_insert on job_automation_log
  for insert with check (auth.uid() = owner_id);

create policy job_automation_log_owner_update on job_automation_log
  for update using (auth.uid() = owner_id);

create policy job_automation_log_owner_delete on job_automation_log
  for delete using (auth.uid() = owner_id);

create index if not exists idx_job_automation_log_job on job_automation_log (job_id);
create index if not exists idx_job_automation_log_owner on job_automation_log (owner_id, created_at desc);
