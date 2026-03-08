-- Add password_changed column to users table so all roles can be checked universally.
-- This replaces the per-role approach (employees.password_changed, hr_profiles.password_changed, etc.)
-- Default is FALSE so existing users (whose password is 000000) will see the change-password modal on login.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS password_changed BOOLEAN NOT NULL DEFAULT FALSE;

-- Anyone who has already changed their password should be set to TRUE.
-- We do this by cross-checking the role-specific profile tables (best-effort only).

-- HR profiles
UPDATE public.users u
SET password_changed = TRUE
FROM public.hr_profiles hp
WHERE hp.user_id = u.id
  AND hp.password_changed = TRUE;

-- Team manager profiles
UPDATE public.users u
SET password_changed = TRUE
FROM public.team_manager_profiles tmp
WHERE tmp.user_id = u.id
  AND tmp.password_changed = TRUE;

-- Employees table
UPDATE public.users u
SET password_changed = TRUE
FROM public.employees e
WHERE e.user_id = u.id
  AND e.password_changed = TRUE;
