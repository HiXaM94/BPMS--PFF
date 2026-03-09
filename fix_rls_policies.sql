-- =====================================================
-- FIX: Add RLS (Row Level Security) read policies
-- =====================================================
-- The payrolls table has RLS enabled but NO SELECT policy,
-- which means authenticated users cannot read any data.
-- This is why the app falls back to mock data.
--
-- RUN THIS IN YOUR SUPABASE SQL EDITOR:
-- Dashboard -> SQL Editor -> New query -> Paste -> Run
-- =====================================================

-- Allow authenticated users to read payrolls
CREATE POLICY "authenticated_read_payrolls"
ON payrolls FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to read employees
CREATE POLICY "authenticated_read_employees"
ON employees FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to read users table
CREATE POLICY "authenticated_read_users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to read departments
CREATE POLICY "authenticated_read_departments"
ON departments FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to read entreprises
CREATE POLICY "authenticated_read_entreprises"
ON entreprises FOR SELECT
TO authenticated
USING (true);
