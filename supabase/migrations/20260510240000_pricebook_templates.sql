-- Pricebook template library — read-only, not owner-scoped, seeded by admin
create table if not exists pricebook_templates (
  id          uuid primary key default gen_random_uuid(),
  trade       text not null,
  name        text not null,
  description text,
  unit_price  numeric(10,2) not null default 0,
  unit        text not null default 'each',
  category    text,
  is_service  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Public read access — no owner scoping needed (template library)
alter table pricebook_templates enable row level security;
create policy "pricebook_templates_public_read"
  on pricebook_templates for select
  using (true);

create index if not exists pricebook_templates_trade_idx on pricebook_templates(trade);
