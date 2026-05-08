-- Founding Member 100 program fields on profiles
-- Migration: 20260509100600_founding_members.sql

alter table profiles add column if not exists is_founding_member boolean default false;
alter table profiles add column if not exists founder_number integer;
alter table profiles add column if not exists founding_joined_at timestamptz;

create unique index if not exists profiles_founder_number_unique
  on profiles(founder_number)
  where founder_number is not null;
