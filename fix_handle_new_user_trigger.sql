-- ==============================================================
-- DEFINITIVE FIX: Run this ONCE in Supabase SQL Editor
-- Fixes the trigger so the HR user row is created BEFORE
-- onAuthStateChange fires, preventing the 406 and session switch
-- ==============================================================

-- 1. Fix the trigger to correctly create public.users on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_entreprise_id uuid;
  v_role          text;
BEGIN
  -- Read metadata safely
  v_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'EMPLOYEE');

  -- Try to cast entreprise_id; ignore if invalid/missing
  BEGIN
    v_entreprise_id := (NEW.raw_user_meta_data->>'entreprise_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_entreprise_id := NULL;
  END;

  -- Insert the user row so RLS policies can find it immediately
  INSERT INTO public.users (id, entreprise_id, name, email, role, status, avatar_initials)
  VALUES (
    NEW.id,
    v_entreprise_id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1)),
    NEW.email,
    v_role::user_role,
    'active'::user_status,
    UPPER(LEFT(COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), NEW.email), 2))
  )
  ON CONFLICT (id) DO UPDATE SET
    entreprise_id  = COALESCE(EXCLUDED.entreprise_id, public.users.entreprise_id),
    name           = EXCLUDED.name,
    role           = EXCLUDED.role::user_role;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block auth signup even if this fails
  RAISE LOG 'handle_new_user failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- 2. Make sure the trigger is attached (recreate if needed)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
