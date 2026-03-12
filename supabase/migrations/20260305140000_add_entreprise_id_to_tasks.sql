-- Add entreprise_id column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE;

-- Populate entreprise_id for existing tasks linked to projects
UPDATE tasks
SET entreprise_id = p.entreprise_id
FROM projects p
WHERE tasks.project_id = p.id
AND tasks.entreprise_id IS NULL;

-- Populate entreprise_id for tasks without projects (using creator)
UPDATE tasks
SET entreprise_id = u.entreprise_id
FROM users u
WHERE tasks.created_by = u.id
AND tasks.entreprise_id IS NULL;

-- Ensure RLS is updated to use the new column
DROP POLICY IF EXISTS "tasks_admin_hr_select_all" ON tasks;
CREATE POLICY "tasks_admin_hr_select_all"
  ON tasks FOR SELECT
  USING (
    (is_admin_or_hr() AND tasks.entreprise_id = auth_user_entreprise()) OR
    (is_manager() AND tasks.entreprise_id = auth_user_entreprise()) OR
    (auth.uid() = assigned_to)
  );

DROP POLICY IF EXISTS "tasks_admin_hr_insert" ON tasks;
CREATE POLICY "tasks_admin_hr_insert"
  ON tasks FOR INSERT
  WITH CHECK (
    (is_admin_or_hr() AND tasks.entreprise_id = auth_user_entreprise()) OR
    (is_manager() AND tasks.entreprise_id = auth_user_entreprise())
  );

DROP POLICY IF EXISTS "tasks_admin_hr_update" ON tasks;
CREATE POLICY "tasks_admin_hr_update"
  ON tasks FOR UPDATE
  USING (
    (is_admin_or_hr() AND tasks.entreprise_id = auth_user_entreprise()) OR
    (is_manager() AND tasks.entreprise_id = auth_user_entreprise()) OR
    (auth.uid() = assigned_to)
  );
