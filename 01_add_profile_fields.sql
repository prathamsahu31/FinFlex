-- 01_add_profile_fields.sql
-- Run this in your Supabase SQL Editor to add the new India-specific onboarding fields.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS monthly_income numeric(12, 2),
ADD COLUMN IF NOT EXISTS household_income numeric(12, 2),
ADD COLUMN IF NOT EXISTS current_savings numeric(12, 2),
ADD COLUMN IF NOT EXISTS monthly_expenses numeric(12, 2),
ADD COLUMN IF NOT EXISTS risk_tolerance text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
