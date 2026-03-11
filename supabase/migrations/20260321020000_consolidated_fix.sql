-- Consolidated Migration: Fix Multitenancy Schema and RLS Proper
-- This file handles column additions and RLS policy updates in one robust script.

-- 1. Support for more roles in user_role enum
-- We wrap this in a DO block to handle errors gracefully if already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role' AND e.enumlabel = 'SUPER_ADMIN') THEN
        ALTER TYPE user_role ADD VALUE 'SUPER_ADMIN';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role' AND e.enumlabel = 'COMPANY_ADMIN') THEN
        ALTER TYPE user_role ADD VALUE 'COMPANY_ADMIN';
    END IF;
EXCEPTION
    WHEN others THEN NULL; -- Enum additions cannot be run in transactions in some environments
END $$;

-- 2. Add entreprise_id columns where missing
-- Payrolls
ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE;
UPDATE payrolls p
SET entreprise_id = e.entreprise_id
FROM employees e
WHERE p.employee_id = e.id
AND p.entreprise_id IS NULL;

-- Vacances
ALTER TABLE vacances ADD COLUMN IF NOT EXISTS entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE;
UPDATE vacances v
SET entreprise_id = e.entreprise_id
FROM employees e
WHERE v.employee_id = e.id
AND v.entreprise_id IS NULL;

-- Candidates
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE;
UPDATE candidates c
SET entreprise_id = r.entreprise_id
FROM recrutements r
WHERE c.recrutement_id = r.id
AND c.entreprise_id IS NULL;

-- 3. Robust Helper Functions (v3)
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

-- 4. Clean up and Re-apply RLS Policies

-- Recrutements
DROP POLICY IF EXISTS "recrutements_admin_all" ON recrutements;
DROP POLICY IF EXISTS "recrutements_hr_entreprise_all" ON recrutements;
DROP POLICY IF EXISTS "recrutements_admin_hr_all" ON recrutements;

CREATE POLICY "recrutements_admin_all" ON recrutements FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "recrutements_hr_entreprise_all" ON recrutements FOR ALL USING (is_hr() AND entreprise_id = auth_user_entreprise()) WITH CHECK (is_hr() AND entreprise_id = auth_user_entreprise());

-- Candidates
DROP POLICY IF EXISTS "candidates_admin_all" ON candidates;
DROP POLICY IF EXISTS "candidates_hr_entreprise_all" ON candidates;
DROP POLICY IF EXISTS "candidates_admin_hr_all" ON candidates;

CREATE POLICY "candidates_admin_all" ON candidates FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "candidates_hr_entreprise_all" ON candidates FOR ALL USING (
    is_hr() AND (
      entreprise_id = auth_user_entreprise() OR
      EXISTS (SELECT 1 FROM recrutements r WHERE r.id = candidates.recrutement_id AND r.entreprise_id = auth_user_entreprise())
    )
) WITH CHECK (
    is_hr() AND (
      entreprise_id = auth_user_entreprise() OR
      EXISTS (SELECT 1 FROM recrutements r WHERE r.id = candidates.recrutement_id AND r.entreprise_id = auth_user_entreprise())
    )
);

-- Payrolls
DROP POLICY IF EXISTS "payrolls_admin_all" ON payrolls;
DROP POLICY IF EXISTS "payrolls_hr_all" ON payrolls;
DROP POLICY IF EXISTS "payrolls_admin_hr_all" ON payrolls;

CREATE POLICY "payrolls_admin_all" ON payrolls FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "payrolls_hr_all" ON payrolls FOR ALL USING (is_hr() AND entreprise_id = auth_user_entreprise()) WITH CHECK (is_hr() AND entreprise_id = auth_user_entreprise());

-- Vacances
DROP POLICY IF EXISTS "vacances_admin_all" ON vacances;
DROP POLICY IF EXISTS "vacances_hr_all" ON vacances;
DROP POLICY IF EXISTS "vacances_admin_hr_all" ON vacances;

CREATE POLICY "vacances_admin_all" ON vacances FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "vacances_hr_all" ON vacances FOR ALL USING (is_hr() AND entreprise_id = auth_user_entreprise()) WITH CHECK (is_hr() AND entreprise_id = auth_user_entreprise());
