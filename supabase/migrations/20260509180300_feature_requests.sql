-- Feature requests and bug reports tables for in-app feedback

create table if not exists feature_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  upvotes integer not null default 0,
  created_at timestamptz not null default now()
);
alter table feature_requests enable row level security;
create policy feature_requests_public_read on feature_requests for select using (true);
create policy feature_requests_owner_insert on feature_requests for insert with check (auth.uid() = user_id);

create table if not exists feature_request_upvotes (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null references feature_requests(id) on delete cascade,
  primary key (user_id, request_id)
);
alter table feature_request_upvotes enable row level security;
create policy frv_owner on feature_request_upvotes for all using (auth.uid() = user_id);

create table if not exists bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  what_doing text not null,
  what_went_wrong text not null,
  current_url text,
  browser_info jsonb,
  console_errors jsonb,
  created_at timestamptz not null default now()
);
alter table bug_reports enable row level security;
create policy bug_reports_owner on bug_reports for all using (auth.uid() = user_id);

create index if not exists idx_feature_requests_upvotes on feature_requests(upvotes desc);
