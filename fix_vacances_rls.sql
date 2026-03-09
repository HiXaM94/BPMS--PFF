-- Execute this in the Supabase SQL Editor to fix the RLS insertion error on vacances
BEGIN;

DROP POLICY IF EXISTS "vacances_self_all" ON vacances;

-- Create individual operations to be absolutely sure the CHECK constraint works
CREATE POLICY "vacances_self_select"
  ON vacances FOR SELECT
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "vacances_self_insert"
  ON vacances FOR INSERT
  WITH CHECK (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "vacances_self_update"
  ON vacances FOR UPDATE
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()))
  WITH CHECK (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "vacances_self_delete"
  ON vacances FOR DELETE
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

COMMIT;
