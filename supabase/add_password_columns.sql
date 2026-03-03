-- ============================================================
-- Run this ONCE in Supabase SQL Editor
-- Fixes: password_changed flag + notifications RLS
-- ============================================================

-- 1. Add columns if missing
ALTER TABLE public.hr_profiles
  ADD COLUMN IF NOT EXISTS password_changed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.hr_profiles
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. Update the RPC to set password_changed = true
--    (SECURITY DEFINER bypasses RLS so the update always works)
CREATE OR REPLACE FUNCTION public.update_hr_password(
  p_user_id  uuid,
  p_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.hr_profiles
  SET password_hash    = p_password,
      password_changed = true
  WHERE user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_hr_password(uuid, text) TO authenticated;

-- 3. Fix RLS for hr_profiles: allow users to read their own record
ALTER TABLE public.hr_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "HR can read own profile" ON public.hr_profiles;
CREATE POLICY "HR can read own profile"
  ON public.hr_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "HR can update own profile" ON public.hr_profiles;
CREATE POLICY "HR can update own profile"
  ON public.hr_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Fix RLS for notifications: allow users to read/update their own
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Mark existing HR accounts that already changed their password
--    (run manually for each account that already changed password)
-- UPDATE public.hr_profiles SET password_changed = true WHERE user_id = 'paste-uuid-here';
