-- Online booking widget fields + enquiries enhancements
-- Migration: 20260509101100_booking_and_enquiries.sql

-- Booking settings on businesses
alter table businesses add column if not exists booking_slug text unique;
alter table businesses add column if not exists booking_enabled boolean not null default false;
alter table businesses add column if not exists booking_service_types jsonb;

-- Add missing fields to client_enquiries if table exists
do $$
begin
  if exists (select from pg_tables where tablename = 'client_enquiries') then
    alter table client_enquiries add column if not exists contact_name text;
    alter table client_enquiries add column if not exists contact_phone text;
    alter table client_enquiries add column if not exists contact_email text;
    alter table client_enquiries add column if not exists address text;
    alter table client_enquiries add column if not exists source text default 'portal';
  end if;
end $$;

-- Job photos table (if not exists)
create table if not exists job_photos (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  job_id      uuid not null references jobs(id) on delete cascade,
  url         text not null,
  label       text not null default 'before', -- 'before' | 'after' | 'during' | 'other'
  caption     text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table job_photos enable row level security;

create policy job_photos_owner_select on job_photos
  for select using (auth.uid() = owner_id);

create policy job_photos_owner_insert on job_photos
  for insert with check (auth.uid() = owner_id);

create policy job_photos_owner_update on job_photos
  for update using (auth.uid() = owner_id);

create policy job_photos_owner_delete on job_photos
  for delete using (auth.uid() = owner_id);

create index if not exists idx_job_photos_job on job_photos (job_id, label);
