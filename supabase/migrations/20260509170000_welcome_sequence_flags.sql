-- Add welcome email sequence tracking flags to profiles
alter table profiles
  add column if not exists welcome_day3_sent boolean not null default false,
  add column if not exists welcome_day7_sent boolean not null default false;
