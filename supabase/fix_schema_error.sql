-- ================================================================
-- FIX: "Database error querying schema" 
-- Run this in Supabase Dashboard → SQL Editor
-- ================================================================

-- Step 1: Drop duplicate triggers (keep only one)
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Recreate the trigger function cleanly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, entreprise_id, name, email, role, status, avatar_initials)
  VALUES (
    NEW.id,
    '11111111-0001-0001-0001-000000000001',
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'EMPLOYEE'::user_role),
    'active'::user_status,
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 2))
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Row already exists, just update it
    UPDATE public.users SET
      email = NEW.email,
      name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
    WHERE id = NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW; -- Don't block auth signup on trigger errors
END;
$$;

-- Step 3: Create single clean trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Grant PostgREST (authenticator) access to query the users table
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.users TO anon, authenticated;
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- Step 5: Force PostgREST to reload
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- Step 6: Verify — this should return the admin row
SELECT id, email, role, status FROM public.users WHERE email = 'admin@techcorp.ma';
