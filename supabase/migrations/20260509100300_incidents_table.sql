-- Incidents table for public status page
-- Migration: 20260509100300_incidents_table.sql

create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'investigating' check (status in ('investigating','identified','monitoring','resolved')),
  severity text not null default 'minor' check (severity in ('minor','major','critical')),
  started_at timestamptz default now(),
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- No RLS needed — public read, admin write only via service role
-- All authenticated users can read; writes only via service role (admin dashboard)
