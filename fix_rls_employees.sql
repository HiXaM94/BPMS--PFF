-- Run this in Supabase SQL Editor
-- Fixes the employees RLS policy so the left join works correctly

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employees visible to same company" ON public.employees;

CREATE POLICY "Employees visible to same company"
  ON public.employees
  FOR SELECT
  TO authenticated
  USING (
    entreprise_id = public.get_my_entreprise_id()
  );

-- We ALSO need a policy allowing users to read the hr_profiles table (if it exists)
-- This ensures that HR data is visible to users in the same company
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'hr_profiles') THEN
        ALTER TABLE public.hr_profiles ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "HRs visible to same company" ON public.hr_profiles;
        CREATE POLICY "HRs visible to same company"
          ON public.hr_profiles
          FOR SELECT
          TO authenticated
          USING (entreprise_id = public.get_my_entreprise_id());
    END IF;
END $$;
