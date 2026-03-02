-- ============================================================
-- RUN THIS IN SUPABASE SQL EDITOR -- FINAL CLEAN FIX
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_hr_profile(
  p_user_id       uuid,
  p_name          text,
  p_email         text,
  p_phone         text,
  p_password      text,
  p_entreprise_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Insert into public.users (linked to the admin's company)
  INSERT INTO public.users (id, entreprise_id, name, email, role, status, avatar_initials)
  VALUES (
    p_user_id,
    p_entreprise_id,
    p_name,
    p_email,
    'HR',
    'active',
    UPPER(LEFT(p_name, 2))
  )
  ON CONFLICT (id) DO UPDATE
    SET entreprise_id = EXCLUDED.entreprise_id,
        name         = EXCLUDED.name,
        role         = EXCLUDED.role,
        status       = EXCLUDED.status;

  -- 2. Insert into public.hr_profiles using user_id (matches your current schema)
  INSERT INTO public.hr_profiles (user_id, password_hash)
  VALUES (p_user_id, p_password)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Allow any logged-in user to call this function
GRANT EXECUTE ON FUNCTION public.create_hr_profile(uuid, text, text, text, text, uuid) TO authenticated;
