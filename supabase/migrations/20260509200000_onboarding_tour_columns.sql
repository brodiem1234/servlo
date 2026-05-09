-- Onboarding tour state columns
-- onboarding_dismissed: user has seen the welcome modal (clicked either button)
-- tour_completed: user has completed the guided tour

alter table profiles add column if not exists onboarding_dismissed boolean default false;
alter table profiles add column if not exists tour_completed boolean default false;

-- Back-fill: anyone who already has onboarding_completed=true is considered dismissed
update profiles set onboarding_dismissed = true where onboarding_completed = true and onboarding_dismissed = false;
