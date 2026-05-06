-- Align legacy / alternate trial end column with app expectations (`trial_end`).
alter table public.profiles add column if not exists trial_end_date timestamptz;

update public.profiles
set trial_end = coalesce(trial_end, trial_end_date)
where trial_end is null and trial_end_date is not null;

update public.profiles
set trial_end_date = coalesce(trial_end_date, trial_end)
where trial_end_date is null and trial_end is not null;
