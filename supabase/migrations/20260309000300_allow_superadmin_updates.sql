-- Add SUPER_ADMIN support to RLS to allow app owner to suspend companies

-- 1. Check if current user is SUPER_ADMIN (Owner)
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  -- The owners table stores সুপার admins (Flowly owners)
  SELECT EXISTS (
      SELECT 1 FROM owners WHERE id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Add POLICY to allow Super Admins to do everything to entreprises
DROP POLICY IF EXISTS "entreprises_super_admin_all" ON entreprises;
CREATE POLICY "entreprises_super_admin_all"
  ON entreprises FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- 3. Add POLICY to allow Super Admins to do everything to users
DROP POLICY IF EXISTS "users_super_admin_all" ON users;
CREATE POLICY "users_super_admin_all"
  ON users FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());
