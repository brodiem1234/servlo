-- Soft delete columns on critical business data tables
-- Uses deleted_at to allow data recovery within 30 days
-- Migration: 20260509100100_soft_deletes.sql

alter table businesses  add column if not exists deleted_at timestamptz null;
alter table jobs        add column if not exists deleted_at timestamptz null;
alter table clients     add column if not exists deleted_at timestamptz null;
alter table invoices    add column if not exists deleted_at timestamptz null;
alter table quotes      add column if not exists deleted_at timestamptz null;
alter table employees   add column if not exists deleted_at timestamptz null;
alter table timesheets  add column if not exists deleted_at timestamptz null;

-- Indexes for efficient filtering of non-deleted rows
create index if not exists idx_jobs_deleted_at      on jobs(deleted_at)      where deleted_at is null;
create index if not exists idx_clients_deleted_at   on clients(deleted_at)   where deleted_at is null;
create index if not exists idx_invoices_deleted_at  on invoices(deleted_at)  where deleted_at is null;
create index if not exists idx_quotes_deleted_at    on quotes(deleted_at)    where deleted_at is null;
create index if not exists idx_employees_deleted_at on employees(deleted_at) where deleted_at is null;

-- TODO: Create /app/(admin)/trash page once admin role is confirmed
-- to allow owners to view and restore soft-deleted records.
