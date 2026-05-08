-- Add per-user AI limit override column to profiles
-- When set, this overrides the plan-based monthly limit for a specific user.
alter table profiles
  add column if not exists ai_limit_override integer default null;
