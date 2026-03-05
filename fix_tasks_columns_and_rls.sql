-- Add finish column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS finish BOOLEAN DEFAULT FALSE;

-- Ensure Admin and HR can see all tasks in their entreprise
DROP POLICY IF EXISTS "tasks_admin_hr_select_all" ON tasks;
CREATE POLICY "tasks_admin_hr_select_all"
  ON tasks FOR SELECT
  USING (
    is_admin_or_hr() AND (
      project_id IS NULL OR
      EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND p.entreprise_id = auth_user_entreprise()) OR
      EXISTS (SELECT 1 FROM users u WHERE u.id = tasks.created_by AND u.entreprise_id = auth_user_entreprise())
    )
  );

-- Also allow managers to see tasks for their team members even if not in a project
DROP POLICY IF EXISTS "tasks_manager_select_team" ON tasks;
CREATE POLICY "tasks_manager_select_team"
  ON tasks FOR SELECT
  USING (
    is_manager() AND (
      project_id IS NULL OR
      EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND p.entreprise_id = auth_user_entreprise()) OR
      EXISTS (SELECT 1 FROM user_details ud WHERE ud.id_user = tasks.assigned_to AND ud.reports_to = auth.uid())
    )
  );
