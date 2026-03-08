-- Migration to fix RLS for user_details table
-- Allows HR and Super Admins to view user details (phone, adresse, department)

-- 1. Policy for HR to view details of users in their own entreprise
DROP POLICY IF EXISTS "user_details_hr_select" ON user_details;
CREATE POLICY "user_details_hr_select"
  ON user_details FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'HR' 
    AND entreprise_id = (SELECT entreprise_id FROM users WHERE id = auth.uid())
  );

-- 2. Policy for Super Admins (Owners) to view all details
DROP POLICY IF EXISTS "user_details_super_admin_all" ON user_details;
CREATE POLICY "user_details_super_admin_all"
  ON user_details FOR ALL
  USING (EXISTS (SELECT 1 FROM owners WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM owners WHERE id = auth.uid()));

-- 3. Policy for Admins (Company Admin) to view all details in their entreprise
DROP POLICY IF EXISTS "user_details_admin_select" ON user_details;
CREATE POLICY "user_details_admin_select"
  ON user_details FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN' 
    AND entreprise_id = (SELECT entreprise_id FROM users WHERE id = auth.uid())
  );
