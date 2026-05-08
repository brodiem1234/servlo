-- Pricebook: reusable materials and service line items
-- Migration: 20260509100900_pricebook.sql

create table if not exists pricebook_items (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  unit        text,          -- e.g. "each", "m²", "hour"
  unit_price  numeric(12,2) not null default 0,
  category    text,          -- e.g. "Labour", "Materials", "Equipment"
  sku         text,
  taxable     boolean not null default true,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table pricebook_items enable row level security;

create policy pricebook_owner_select on pricebook_items
  for select using (auth.uid() = owner_id);

create policy pricebook_owner_insert on pricebook_items
  for insert with check (auth.uid() = owner_id);

create policy pricebook_owner_update on pricebook_items
  for update using (auth.uid() = owner_id);

create policy pricebook_owner_delete on pricebook_items
  for delete using (auth.uid() = owner_id);

create index if not exists idx_pricebook_owner
  on pricebook_items (owner_id, is_active, category);
