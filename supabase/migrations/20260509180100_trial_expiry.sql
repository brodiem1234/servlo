-- Trial expiry notification tracking columns
-- trial_end is already canonical on profiles (from corrective schema consolidation)
-- Adding notification tracking flags and expiry timestamp

alter table profiles add column if not exists trial_expired_notified_3day boolean not null default false;
alter table profiles add column if not exists trial_expired_notified_1day boolean not null default false;
alter table profiles add column if not exists trial_expired_at timestamptz;
