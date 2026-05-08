-- Xero and MYOB OAuth token storage
-- Migration: 20260509101500_xero_myob.sql

create table if not exists accounting_connections (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  provider        text not null check (provider in ('xero', 'myob')),
  tenant_id       text,           -- Xero tenant/org ID, MYOB company file URI
  tenant_name     text,
  access_token    text,           -- encrypted at application layer; DO NOT log
  refresh_token   text,
  expires_at      timestamptz,
  scopes          text,
  is_active       boolean not null default true,
  last_synced_at  timestamptz,
  created_at      timestamptz not null default now(),
  unique (owner_id, provider)
);

alter table accounting_connections enable row level security;

create policy accounting_connections_owner_select on accounting_connections
  for select using (auth.uid() = owner_id);

create policy accounting_connections_owner_insert on accounting_connections
  for insert with check (auth.uid() = owner_id);

create policy accounting_connections_owner_update on accounting_connections
  for update using (auth.uid() = owner_id);

create policy accounting_connections_owner_delete on accounting_connections
  for delete using (auth.uid() = owner_id);

create index if not exists idx_accounting_connections_owner on accounting_connections (owner_id, provider);

-- Track what has been exported to Xero/MYOB
alter table invoices add column if not exists xero_invoice_id text;
alter table invoices add column if not exists myob_invoice_id text;
alter table clients  add column if not exists xero_contact_id text;
alter table clients  add column if not exists myob_contact_id text;
