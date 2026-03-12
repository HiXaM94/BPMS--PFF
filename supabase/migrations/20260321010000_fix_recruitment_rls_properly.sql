-- Migration: Fix Recruitment RLS and Admin Global Access
-- This migration ensures Admins have global access while HR/Managers remain enterprise-restricted.

-- 1. Expand User Roles Enum
-- Note: 'ALTER TYPE ... ADD VALUE' cannot be run inside a transaction block in some Postgres versions.
-- But Supabase handles it if run as a single statement or in separate migrations.
-- We'll try it here; if it fails, the rest will still work if 'ADMIN' is used.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'COMPANY_ADMIN';

-- 2. Update recrutements (Job Postings)
DROP POLICY IF EXISTS "recrutements_admin_hr_all" ON recrutements;
DROP POLICY IF EXISTS "recrutements_admin_all" ON recrutements;
DROP POLICY IF EXISTS "recrutements_hr_entreprise_all" ON recrutements;

-- Admin: Global access
CREATE POLICY "recrutements_admin_all"
  ON recrutements FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- HR: Restricted to their enterprise
CREATE POLICY "recrutements_hr_entreprise_all"
  ON recrutements FOR ALL
  USING (is_hr() AND entreprise_id = auth_user_entreprise())
  WITH CHECK (is_hr() AND entreprise_id = auth_user_entreprise());

-- 3. Update candidates
DROP POLICY IF EXISTS "candidates_admin_hr_all" ON candidates;
DROP POLICY IF EXISTS "candidates_admin_all" ON candidates;
DROP POLICY IF EXISTS "candidates_hr_entreprise_all" ON candidates;

-- Admin: Global access
CREATE POLICY "candidates_admin_all"
  ON candidates FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- HR: Restricted to their enterprise's recruitment postings
CREATE POLICY "candidates_hr_entreprise_all"
  ON candidates FOR ALL
  USING (
    is_hr() AND (
      entreprise_id = auth_user_entreprise() OR
      EXISTS (
        SELECT 1 FROM recrutements r
        WHERE r.id = candidates.recrutement_id
          AND r.entreprise_id = auth_user_entreprise()
      )
    )
  )
  WITH CHECK (
    is_hr() AND (
      entreprise_id = auth_user_entreprise() OR
      EXISTS (
        SELECT 1 FROM recrutements r
        WHERE r.id = candidates.recrutement_id
          AND r.entreprise_id = auth_user_entreprise()
      )
    )
  );

-- 4. Fix Payrolls & Vacances (The ones causing 400/403 errors recently)
DROP POLICY IF EXISTS "payrolls_admin_hr_all" ON payrolls;
CREATE POLICY "payrolls_admin_all" ON payrolls FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "payrolls_hr_all" ON payrolls FOR ALL USING (is_hr() AND entreprise_id = auth_user_entreprise()) WITH CHECK (is_hr() AND entreprise_id = auth_user_entreprise());

DROP POLICY IF EXISTS "vacances_admin_hr_all" ON vacances;
CREATE POLICY "vacances_admin_all" ON vacances FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "vacances_hr_all" ON vacances FOR ALL USING (is_hr() AND entreprise_id = auth_user_entreprise()) WITH CHECK (is_hr() AND entreprise_id = auth_user_entreprise());

-- 5. Robust Admin Check Helper (Case-insensitive and handles nulls)
CREATE OR REPLACE FUNCTION auth_user_role_v3()
RETURNS TEXT AS $$
  SELECT UPPER(role::TEXT) FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT auth_user_role_v3() IN ('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_hr()
RETURNS BOOLEAN AS $$
  SELECT auth_user_role_v3() = 'HR';
$$ LANGUAGE sql STABLE SECURITY DEFINER;
