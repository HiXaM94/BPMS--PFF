-- ================================================================
-- FIX: Replace ENUM-returning RLS functions with text-returning ones
-- Root cause: auth_user_role() returning user_role ENUM causes
-- GoTrue to crash during schema introspection on signInWithPassword
-- ================================================================

-- Drop old ENUM-returning versions first (CASCADE drops dependent policies)
DROP FUNCTION IF EXISTS public.auth_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_hr() CASCADE;
DROP FUNCTION IF EXISTS public.is_manager() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_or_hr() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_hr_or_manager() CASCADE;

-- Recreate auth_user_role() returning TEXT (not the ENUM)
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE((SELECT role::text FROM public.users WHERE id = auth.uid()), 'EMPLOYEE');
$$;

-- Recreate boolean helpers using TEXT comparison
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(public.auth_user_role() = 'ADMIN', false);
$$;

CREATE OR REPLACE FUNCTION public.is_hr()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(public.auth_user_role() = 'HR', false);
$$;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(public.auth_user_role() = 'TEAM_MANAGER', false);
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_hr()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(public.auth_user_role() IN ('ADMIN', 'HR'), false);
$$;

CREATE OR REPLACE FUNCTION public.is_admin_hr_or_manager()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(public.auth_user_role() IN ('ADMIN', 'HR', 'TEAM_MANAGER'), false);
$$;

-- Recreate RLS policies that were dropped by CASCADE
-- ENTREPRISES
DROP POLICY IF EXISTS "Users see their own entreprise"  ON public.entreprises;
DROP POLICY IF EXISTS "Admins manage all entreprises"   ON public.entreprises;
CREATE POLICY "Users see their own entreprise" ON public.entreprises
  FOR SELECT USING (id = public.auth_user_entreprise());
CREATE POLICY "Admins manage all entreprises" ON public.entreprises
  FOR ALL USING (public.is_admin());

-- USERS
DROP POLICY IF EXISTS "Users read own profile"          ON public.users;
DROP POLICY IF EXISTS "Admin HR read all users"         ON public.users;
DROP POLICY IF EXISTS "Admin HR update users"           ON public.users;
DROP POLICY IF EXISTS "Users update own profile"        ON public.users;
CREATE POLICY "Users read own profile" ON public.users
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admin HR read all users" ON public.users
  FOR SELECT USING (public.is_admin_or_hr());
CREATE POLICY "Admin HR update users" ON public.users
  FOR UPDATE USING (public.is_admin_or_hr());
CREATE POLICY "Users update own profile" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- DEPARTMENTS
DROP POLICY IF EXISTS "Same entreprise reads departments" ON public.departments;
DROP POLICY IF EXISTS "Admin HR manage departments"       ON public.departments;
CREATE POLICY "Same entreprise reads departments" ON public.departments
  FOR SELECT USING (entreprise_id = public.auth_user_entreprise());
CREATE POLICY "Admin HR manage departments" ON public.departments
  FOR ALL USING (public.is_admin_or_hr());

-- EMPLOYEES
DROP POLICY IF EXISTS "Employees read own record"        ON public.employees;
DROP POLICY IF EXISTS "Admin HR read all employees"      ON public.employees;
DROP POLICY IF EXISTS "Manager reads team employees"     ON public.employees;
DROP POLICY IF EXISTS "Admin HR manage employees"        ON public.employees;
CREATE POLICY "Employees read own record" ON public.employees
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin HR read all employees" ON public.employees
  FOR SELECT USING (public.is_admin_or_hr());
CREATE POLICY "Manager reads team employees" ON public.employees
  FOR SELECT USING (public.is_manager() AND entreprise_id = public.auth_user_entreprise());
CREATE POLICY "Admin HR manage employees" ON public.employees
  FOR ALL USING (public.is_admin_or_hr());

-- Ensure grants
GRANT EXECUTE ON FUNCTION public.auth_user_role()           TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin()                 TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_hr()                    TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_manager()               TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_or_hr()           TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_hr_or_manager()   TO authenticated, anon;

-- Force PostgREST to reload
SELECT pg_notify('pgrst', 'reload schema');

-- Verify
SELECT proname, pg_get_function_result(p.oid) as returns
FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND proname IN ('auth_user_role','is_admin','is_hr','is_manager','is_admin_or_hr');
