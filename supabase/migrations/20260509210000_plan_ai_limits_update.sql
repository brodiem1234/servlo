-- Update AI limits to match new pricing
UPDATE plan_ai_limits SET monthly_limit = 0 WHERE plan = 'free';
UPDATE plan_ai_limits SET monthly_limit = 50 WHERE plan = 'solo';
UPDATE plan_ai_limits SET monthly_limit = 200 WHERE plan = 'team';
UPDATE plan_ai_limits SET monthly_limit = 500 WHERE plan = 'business';
UPDATE plan_ai_limits SET monthly_limit = 2000 WHERE plan = 'enterprise';

-- Add free plan if missing
INSERT INTO plan_ai_limits (plan, monthly_limit, is_soft_cap)
VALUES ('free', 0, false) ON CONFLICT (plan) DO UPDATE SET monthly_limit = 0;
