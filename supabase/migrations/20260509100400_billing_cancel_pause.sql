-- Cancellation, pause, and dunning fields on profiles
-- Migration: 20260509100400_billing_cancel_pause.sql

alter table profiles add column if not exists cancellation_pending boolean default false;
alter table profiles add column if not exists cancellation_takes_effect_at timestamptz;
alter table profiles add column if not exists cancellation_reason text;
alter table profiles add column if not exists pause_starts_at timestamptz;
alter table profiles add column if not exists pause_ends_at timestamptz;
alter table profiles add column if not exists paused boolean default false;
alter table profiles add column if not exists payment_failed_at timestamptz;
alter table profiles add column if not exists payment_retry_count integer default 0;
alter table profiles add column if not exists dunning_step integer default 0;
