-- Migration: Fix Multitenancy Schema and RLS
-- This migration adds entreprise_id to tables where it was missing to simplify queries and fix 400 errors.

-- 1. Add entreprise_id to payrolls
ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE;
UPDATE payrolls p
SET entreprise_id = e.entreprise_id
FROM employees e
WHERE p.employee_id = e.id
AND p.entreprise_id IS NULL;

-- 2. Add entreprise_id to vacances
ALTER TABLE vacances ADD COLUMN IF NOT EXISTS entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE;
UPDATE vacances v
SET entreprise_id = e.entreprise_id
FROM employees e
WHERE v.employee_id = e.id
AND v.entreprise_id IS NULL;

-- 3. Add entreprise_id to candidates
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE;
UPDATE candidates c
SET entreprise_id = r.entreprise_id
FROM recrutements r
WHERE c.recrutement_id = r.id
AND c.entreprise_id IS NULL;

-- 4. Update RLS Policies for performance and consistency

-- HR/Admin should be able to see all candidates in their entreprise
DROP POLICY IF EXISTS "candidates_admin_hr_all" ON candidates;
CREATE POLICY "candidates_admin_hr_all"
  ON candidates FOR ALL
  USING (is_admin_or_hr() AND entreprise_id = auth_user_entreprise())
  WITH CHECK (is_admin_or_hr() AND entreprise_id = auth_user_entreprise());

DROP POLICY IF EXISTS "candidates_manager_select" ON candidates;
CREATE POLICY "candidates_manager_select"
  ON candidates FOR SELECT
  USING (is_manager() AND entreprise_id = auth_user_entreprise());

-- Fix RLS for recrutements (403 error fix)
-- Ensure HR and ADMIN can fully manage their own recrutements
DROP POLICY IF EXISTS "recrutements_admin_hr_all" ON recrutements;
CREATE POLICY "recrutements_admin_hr_all"
  ON recrutements FOR ALL
  USING (is_admin_or_hr() AND entreprise_id = auth_user_entreprise())
  WITH CHECK (is_admin_or_hr() AND entreprise_id = auth_user_entreprise());

-- Ensure payrolls and vacances RLS also use the new column for performance
DROP POLICY IF EXISTS "payrolls_admin_hr_all" ON payrolls;
CREATE POLICY "payrolls_admin_hr_all"
  ON payrolls FOR ALL
  USING (is_admin_or_hr() AND entreprise_id = auth_user_entreprise())
  WITH CHECK (is_admin_or_hr() AND entreprise_id = auth_user_entreprise());

DROP POLICY IF EXISTS "vacances_admin_hr_all" ON vacances;
CREATE POLICY "vacances_admin_hr_all"
  ON vacances FOR ALL
  USING (is_admin_or_hr() AND entreprise_id = auth_user_entreprise())
  WITH CHECK (is_admin_or_hr() AND entreprise_id = auth_user_entreprise());

-- 5. Additional fix: If some users have lowercase roles, let's make the helper functions case-insensitive as a safety measure
CREATE OR REPLACE FUNCTION auth_user_role_v2()
RETURNS TEXT AS $$
  SELECT UPPER(role::TEXT) FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT auth_user_role_v2() IN ('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_hr()
RETURNS BOOLEAN AS $$
  SELECT auth_user_role_v2() = 'HR';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_or_hr()
RETURNS BOOLEAN AS $$
  SELECT auth_user_role_v2() IN ('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'HR');
$$ LANGUAGE sql STABLE SECURITY DEFINER;
