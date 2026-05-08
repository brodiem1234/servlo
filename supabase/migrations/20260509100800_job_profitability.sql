-- Per-job profitability fields
-- Migration: 20260509100800_job_profitability.sql

-- These columns may already exist on some db versions; use IF NOT EXISTS
alter table jobs add column if not exists revenue numeric(12,2) null;
alter table jobs add column if not exists materials_cost numeric(12,2) null;
alter table jobs add column if not exists labour_hours numeric(8,2) null;
alter table jobs add column if not exists hourly_rate numeric(10,2) null;

-- Computed profit can be derived: revenue - materials_cost - (labour_hours * hourly_rate)
-- No stored computed column to avoid migration complexity — derive in app layer.

-- Index for profitability report queries
create index if not exists idx_jobs_owner_profit
  on jobs (owner_id, status)
  where deleted_at is null;
