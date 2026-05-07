-- Add contractor-specific fields to the employees table.
-- These columns are used by records with role = 'contractor'.
ALTER TABLE employees ADD COLUMN IF NOT EXISTS abn text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS business_name text;
