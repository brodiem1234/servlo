create type public.user_role as enum ('owner', 'employee');
create type public.job_status as enum ('open', 'in_progress', 'done');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid,
  full_name text,
  role public.user_role not null default 'employee',
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  assigned_employee_id uuid references public.profiles(id) on delete set null,
  title text not null,
  status public.job_status not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.timesheets (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  clock_in_at timestamptz not null default now(),
  clock_out_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.timesheets enable row level security;

create policy "Owners can read all profiles in business"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'owner' and p.business_id = profiles.business_id
    )
    or id = auth.uid()
  );

create policy "Owners can manage jobs; employees read assigned"
  on public.jobs for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'owner' and p.business_id = jobs.business_id
    )
    or assigned_employee_id = auth.uid()
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'owner' and p.business_id = jobs.business_id
    )
  );

create policy "Owners see all timesheets; employees see own"
  on public.timesheets for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'owner'
        and p.business_id = (
          select p2.business_id from public.profiles p2 where p2.id = timesheets.employee_id
        )
    )
    or employee_id = auth.uid()
  );

create policy "Employees create/update own timesheets"
  on public.timesheets for insert
  with check (employee_id = auth.uid());
