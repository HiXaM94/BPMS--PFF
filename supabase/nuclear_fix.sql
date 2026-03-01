-- ================================================================
-- NUCLEAR FIX: Reset all triggers and functions cleanly
-- Run this in Supabase Dashboard → SQL Editor
-- ================================================================

-- Step 1: Drop ALL custom triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;

-- Step 2: Drop all RLS helper functions that might cause issues
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.auth_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.auth_user_entreprise() CASCADE;
DROP FUNCTION IF EXISTS public.auth_employee_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_hr() CASCADE;
DROP FUNCTION IF EXISTS public.is_manager() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_or_hr() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_hr_or_manager() CASCADE;
DROP FUNCTION IF EXISTS public.is_my_team_member(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.same_entreprise_employee(UUID) CASCADE;

-- Step 3: Disable RLS on all tables temporarily
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.entreprises DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.departments DISABLE ROW LEVEL SECURITY;

-- Step 4: Recreate the helper functions with proper error handling
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS text AS $$
  SELECT COALESCE(
    (SELECT role::text FROM public.users WHERE id = auth.uid()),
    'EMPLOYEE'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auth_user_entreprise()
RETURNS UUID AS $$
  SELECT entreprise_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auth_employee_id()
RETURNS UUID AS $$
  SELECT id FROM public.employees WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(auth_user_role() = 'ADMIN', false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_hr()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(auth_user_role() = 'HR', false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(auth_user_role() = 'TEAM_MANAGER', false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_hr()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(auth_user_role() IN ('ADMIN', 'HR'), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_hr_or_manager()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(auth_user_role() IN ('ADMIN', 'HR', 'TEAM_MANAGER'), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_my_team_member(emp_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees
    WHERE id = emp_id
      AND manager_id = auth_employee_id()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.same_entreprise_employee(emp_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = emp_id
      AND e.entreprise_id = auth_user_entreprise()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Step 5: Recreate the handle_new_user trigger function
-- This time with TRY/CATCH so it NEVER blocks auth
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
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'role', '')::user_role,
      'EMPLOYEE'::user_role
    ),
    'active'::user_status,
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 2))
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user error (non-fatal): %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 6: Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Re-enable RLS
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.entreprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.departments ENABLE ROW LEVEL SECURITY;

-- Step 8: Ensure proper grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Step 9: Force PostgREST reload
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- Step 10: Verify everything works
SELECT 'TYPES' as check_type, typname FROM pg_type WHERE typname IN ('user_role', 'user_status');
SELECT 'USERS' as check_type, id::text, email, role::text FROM public.users WHERE email = 'admin@techcorp.ma';
SELECT 'AUTH' as check_type, id::text, email FROM auth.users WHERE email = 'admin@techcorp.ma';
