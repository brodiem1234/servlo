-- Brand accent per owner (dashboard theming). Apply via Supabase migrations or SQL Editor.

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  accent_colour text not null default '#0891B2',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_owner_id_key unique (owner_id)
);

create index if not exists idx_businesses_owner_id on public.businesses (owner_id);

alter table public.businesses enable row level security;

create policy "Owners can read own business row"
  on public.businesses for select
  using (owner_id = auth.uid());

create policy "Owners can insert own business row"
  on public.businesses for insert
  with check (owner_id = auth.uid());

create policy "Owners can update own business row"
  on public.businesses for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

comment on column public.businesses.accent_colour is 'Preset hex only; dashboard maps to --accent-color';
