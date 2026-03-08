-- Fix RLS for user_details to allow HR and ADMIN to manage employee departments
-- This migration ensures that profile updates from User Management are persisted.

-- 1. Ensure user_details policies are robust
DROP POLICY IF EXISTS "user_details_admin_all" ON user_details;
DROP POLICY IF EXISTS "user_details_hr_manage" ON user_details;

-- Admin can manage all user details
CREATE POLICY "user_details_admin_all"
  ON user_details FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'ADMIN'
    )
  );

-- HR can manage user details for users in their same entreprise
CREATE POLICY "user_details_hr_manage"
  ON user_details FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users manager
      JOIN users target ON target.entreprise_id = manager.entreprise_id
      WHERE manager.id = auth.uid()
        AND manager.role = 'HR'
        AND target.id = user_details.id_user
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users manager
      JOIN users target ON target.entreprise_id = manager.entreprise_id
      WHERE manager.id = auth.uid()
        AND manager.role = 'HR'
        AND target.id = user_details.id_user
    )
  );

-- 2. Consistency fix for users_hr_update
-- Ensure HR can only update users within their same entreprise
DROP POLICY IF EXISTS "users_hr_update" ON users;
CREATE POLICY "users_hr_update"
  ON users FOR UPDATE
  USING (
    role = 'HR' AND entreprise_id = (SELECT entreprise_id FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    role = 'HR' AND entreprise_id = (SELECT entreprise_id FROM users WHERE id = auth.uid())
  );

-- Wait, the above logic is slightly flawed. It says the USER BEING UPDATED must have role 'HR'.
-- It should say: if the CURRENT USER is HR, they can update others in their entreprise.

CREATE OR REPLACE FUNCTION is_hr_in_same_entreprise(target_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users manager
    JOIN users target ON target.entreprise_id = manager.entreprise_id
    WHERE manager.id = auth.uid()
      AND manager.role = 'HR'
      AND target.id = target_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

DROP POLICY IF EXISTS "users_hr_update" ON users;
CREATE POLICY "users_hr_update"
  ON users FOR UPDATE
  USING (is_hr_in_same_entreprise(id))
  WITH CHECK (is_hr_in_same_entreprise(id));
