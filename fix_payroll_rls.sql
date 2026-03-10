-- The current RLS policy uses same_entreprise_employee(employee_id) which relies on 
-- finding the employee's entreprise_id in the employees table and comparing it to 
-- auth_user_entreprise(). This can fail on INSERT if the DB gets confused by permissions 
-- or if it doesn't correctly resolve the employee record during the insert phase.

-- We don't have entreprise_id on the payrolls table directly, so the join is strictly required.

-- Let's redefine the policy for `payrolls_admin_hr_all` to be more robust.
DROP POLICY IF EXISTS "payrolls_admin_hr_all" ON payrolls;

-- Recreate it, explicitly joining with employees to verify permissions
CREATE POLICY "payrolls_admin_hr_all"
ON payrolls FOR ALL
USING (
  is_admin_or_hr() AND 
  EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.id = payrolls.employee_id 
    AND e.entreprise_id = auth_user_entreprise()
  )
)
WITH CHECK (
  is_admin_or_hr() AND 
  EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.id = employee_id 
    AND e.entreprise_id = auth_user_entreprise()
  )
);
