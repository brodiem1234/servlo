-- Referral rows are created by trusted server code with the service role.
-- Do not allow authenticated clients to forge referrals for arbitrary users.
drop policy if exists user_referrals_insert on user_referrals;
