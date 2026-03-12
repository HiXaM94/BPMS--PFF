-- Migration to add onboarding_completed flag to users table
-- This provides a definitive way to prevent onboarding reminders from reappearing
-- Date: 2026-03-08

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Backfill: If a user has a record in user_details, mark them as completed
UPDATE public.users u
SET onboarding_completed = true
FROM public.user_details ud
WHERE u.id = ud.id_user;

-- Also check team_manager_profiles for managers
UPDATE public.users u
SET onboarding_completed = true
FROM public.team_manager_profiles tmp
WHERE u.id = tmp.user_id 
AND u.role = 'TEAM_MANAGER';
