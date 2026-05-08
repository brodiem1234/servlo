-- White-label brand settings on businesses table
-- Migration: 20260509100700_brand_settings.sql

alter table businesses add column if not exists brand_logo_url text;
alter table businesses add column if not exists brand_color_primary text;
alter table businesses add column if not exists brand_company_name text;
alter table businesses add column if not exists brand_email_from_name text;
alter table businesses add column if not exists brand_phone text;
alter table businesses add column if not exists brand_address text;
