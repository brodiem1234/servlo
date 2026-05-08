-- Fix job_photos table: use storage_path instead of url, add has_photos to jobs
-- Migration: 20260509101200_job_photos_fix.sql

-- Drop old url column if it exists and add storage_path
alter table job_photos add column if not exists storage_path text;
update job_photos set storage_path = url where storage_path is null and url is not null;
alter table job_photos alter column storage_path set not null;

-- Add caption default and ensure label default exists
alter table job_photos alter column label set default 'before';

-- Add has_photos flag to jobs (avoids heavy photo count joins)
alter table jobs add column if not exists has_photos boolean not null default false;

-- Index for the storage_path lookups
create index if not exists idx_job_photos_storage on job_photos (job_id, storage_path);
