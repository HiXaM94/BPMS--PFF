-- EMERGENCY FIX: Remove the recursive policy that broke login!
-- Run this immediately in Supabase SQL Editor.

-- Step 1: Drop the broken recursive policy
DROP POLICY IF EXISTS "Users can read same company" ON public.users;
DROP POLICY IF EXISTS "Users can read own row" ON public.users;

-- Step 2: Create a helper function that reads entreprise_id WITHOUT triggering RLS
-- (SECURITY DEFINER bypasses RLS so there is no recursion)
CREATE OR REPLACE FUNCTION public.get_my_entreprise_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT entreprise_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- Step 3: Create the correct non-recursive policy using the function
CREATE POLICY "Users can read same company"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    entreprise_id = public.get_my_entreprise_id()
  );