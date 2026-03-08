-- Apply this in the Supabase SQL Editor to guarantee that HR and Managers can see their employees' requests

BEGIN;

-- Remove old policies that rely on security functions
DROP POLICY IF EXISTS "vacances_admin_hr_all" ON vacances;
DROP POLICY IF EXISTS "vacances_manager_select" ON vacances;
DROP POLICY IF EXISTS "vacances_manager_update" ON vacances;

-- Create bulletproof inline policies for Admin and HR
CREATE POLICY "vacances_admin_hr_all"
  ON vacances FOR ALL
  USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
          AND u.role IN ('ADMIN', 'HR')
          AND u.entreprise_id = (SELECT entreprise_id FROM employees e WHERE e.id = vacances.employee_id)
    )
  )
  WITH CHECK (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
          AND u.role IN ('ADMIN', 'HR')
          AND u.entreprise_id = (SELECT entreprise_id FROM employees e WHERE e.id = vacances.employee_id)
    )
  );

-- Create bulletproof inline policies for Team Managers
CREATE POLICY "vacances_manager_select"
  ON vacances FOR SELECT
  USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
          AND u.role = 'TEAM_MANAGER'
    )
    AND employee_id IN (
        SELECT id FROM employees e WHERE e.manager_id = (SELECT id FROM employees m WHERE m.user_id = auth.uid())
    )
  );

CREATE POLICY "vacances_manager_update"
  ON vacances FOR UPDATE
  USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
          AND u.role = 'TEAM_MANAGER'
    )
    AND employee_id IN (
        SELECT id FROM employees e WHERE e.manager_id = (SELECT id FROM employees m WHERE m.user_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
          AND u.role = 'TEAM_MANAGER'
    )
    AND employee_id IN (
        SELECT id FROM employees e WHERE e.manager_id = (SELECT id FROM employees m WHERE m.user_id = auth.uid())
    )
  );

COMMIT;
