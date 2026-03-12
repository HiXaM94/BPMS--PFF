-- Fix: Add missing INSERT/UPDATE/DELETE RLS policies for recrutements table
-- HR and Admin users need to manage job postings

DROP POLICY IF EXISTS "HR and Admin can insert jobs" ON recrutements;
DROP POLICY IF EXISTS "HR and Admin can update jobs" ON recrutements;
DROP POLICY IF EXISTS "HR and Admin can delete jobs" ON recrutements;
DROP POLICY IF EXISTS "HR and Admin can view all jobs" ON recrutements;

-- Allow HR/Admin to view ALL jobs (not just public open ones)
CREATE POLICY "HR and Admin can view all jobs"
ON recrutements FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'HR')
  )
);

-- Allow HR/Admin to create job postings
CREATE POLICY "HR and Admin can insert jobs"
ON recrutements FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'HR')
  )
);

-- Allow HR/Admin to update job postings
CREATE POLICY "HR and Admin can update jobs"
ON recrutements FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'HR')
  )
);

-- Allow HR/Admin to delete job postings
CREATE POLICY "HR and Admin can delete jobs"
ON recrutements FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'HR')
  )
);
