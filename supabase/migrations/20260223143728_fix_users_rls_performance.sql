-- Fix RLS performance issue on users table
-- The self-select policy should use direct auth.uid() check to avoid circular dependency
-- This prevents slowness when users try to fetch their own profile

-- Drop and recreate the users_self_select policy without helper functions
DROP POLICY IF EXISTS "users_self_select" ON users;

CREATE POLICY "users_self_select"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Also update the self-update policy
DROP POLICY IF EXISTS "users_self_update" ON users;

CREATE POLICY "users_self_update"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
