-- Compliance forms builder
-- Migration: 20260509101000_compliance_forms.sql

create table if not exists compliance_forms (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  fields      jsonb not null default '[]',   -- Array of field definitions
  is_template boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table compliance_forms enable row level security;

create policy compliance_forms_owner_select on compliance_forms
  for select using (auth.uid() = owner_id);

create policy compliance_forms_owner_insert on compliance_forms
  for insert with check (auth.uid() = owner_id);

create policy compliance_forms_owner_update on compliance_forms
  for update using (auth.uid() = owner_id);

create policy compliance_forms_owner_delete on compliance_forms
  for delete using (auth.uid() = owner_id);

-- Submitted form responses (linked to jobs)
create table if not exists compliance_submissions (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  form_id     uuid not null references compliance_forms(id) on delete cascade,
  job_id      uuid references jobs(id) on delete set null,
  submitted_by uuid references auth.users(id) on delete set null,
  responses   jsonb not null default '{}',
  submitted_at timestamptz not null default now()
);

alter table compliance_submissions enable row level security;

create policy compliance_submissions_owner_select on compliance_submissions
  for select using (auth.uid() = owner_id);

create policy compliance_submissions_owner_insert on compliance_submissions
  for insert with check (auth.uid() = owner_id);

create policy compliance_submissions_owner_update on compliance_submissions
  for update using (auth.uid() = owner_id);

create policy compliance_submissions_owner_delete on compliance_submissions
  for delete using (auth.uid() = owner_id);

create index if not exists idx_compliance_forms_owner on compliance_forms (owner_id, is_active);
create index if not exists idx_compliance_submissions_owner on compliance_submissions (owner_id, form_id);
