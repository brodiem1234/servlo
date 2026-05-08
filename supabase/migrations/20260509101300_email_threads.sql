-- Email threads and messages for two-way client communication
-- Migration: 20260509101300_email_threads.sql

create table if not exists email_threads (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  client_id    uuid references clients(id) on delete set null,
  job_id       uuid references jobs(id) on delete set null,
  subject      text not null default '',
  last_message_at timestamptz not null default now(),
  message_count int not null default 0,
  created_at   timestamptz not null default now()
);

alter table email_threads enable row level security;

create policy email_threads_owner_select on email_threads
  for select using (auth.uid() = owner_id);

create policy email_threads_owner_insert on email_threads
  for insert with check (auth.uid() = owner_id);

create policy email_threads_owner_update on email_threads
  for update using (auth.uid() = owner_id);

create policy email_threads_owner_delete on email_threads
  for delete using (auth.uid() = owner_id);

create index if not exists idx_email_threads_owner on email_threads (owner_id, last_message_at desc);
create index if not exists idx_email_threads_client on email_threads (client_id);
create index if not exists idx_email_threads_job on email_threads (job_id);

create table if not exists email_messages (
  id           uuid primary key default gen_random_uuid(),
  thread_id    uuid not null references email_threads(id) on delete cascade,
  owner_id     uuid not null references auth.users(id) on delete cascade,
  direction    text not null check (direction in ('outbound', 'inbound')),
  from_email   text not null default '',
  to_email     text not null default '',
  subject      text not null default '',
  body_html    text,
  body_text    text,
  resend_id    text,           -- Resend message ID for tracking
  status       text not null default 'sent' check (status in ('draft', 'sent', 'delivered', 'bounced', 'failed')),
  sent_at      timestamptz,
  received_at  timestamptz,
  created_at   timestamptz not null default now()
);

alter table email_messages enable row level security;

create policy email_messages_owner_select on email_messages
  for select using (auth.uid() = owner_id);

create policy email_messages_owner_insert on email_messages
  for insert with check (auth.uid() = owner_id);

create policy email_messages_owner_update on email_messages
  for update using (auth.uid() = owner_id);

create policy email_messages_owner_delete on email_messages
  for delete using (auth.uid() = owner_id);

create index if not exists idx_email_messages_thread on email_messages (thread_id, created_at asc);
create index if not exists idx_email_messages_owner on email_messages (owner_id, created_at desc);
create index if not exists idx_email_messages_resend on email_messages (resend_id) where resend_id is not null;
