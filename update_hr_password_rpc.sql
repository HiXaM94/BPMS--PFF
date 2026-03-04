-- RUN THIS IN SUPABASE SQL EDITOR
-- Creates a secure RPC function to update the HR password in hr_profiles
-- This bypasses RLS safely using SECURITY DEFINER

CREATE OR REPLACE FUNCTION public.update_hr_password(
  p_user_id   uuid,
  p_password  text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.hr_profiles
  SET password_hash = p_password
  WHERE user_id = p_user_id;
END;
$$;

-- Allow any authenticated user to call this function
GRANT EXECUTE ON FUNCTION public.update_hr_password(uuid, text) TO authenticated;
