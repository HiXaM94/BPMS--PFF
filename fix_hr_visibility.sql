-- 1. ADAPT Projects Policies for HR and Admin
DROP POLICY IF EXISTS "projects_hr_admin_select" ON projects;
CREATE POLICY "projects_hr_admin_select" 
  ON projects FOR SELECT 
  USING (entreprise_id = auth_user_entreprise() AND is_admin_or_hr());

-- 2. ADAPT Tasks Policies for HR and Admin
DROP POLICY IF EXISTS "tasks_hr_admin_select" ON tasks;
CREATE POLICY "tasks_hr_admin_select" 
  ON tasks FOR SELECT 
  USING (
    is_admin_or_hr() AND (
      -- Case 1: Task belongs to a project in the user's entreprise
      EXISTS (
        SELECT 1 FROM projects p 
        WHERE p.id = tasks.project_id AND p.entreprise_id = auth_user_entreprise()
      )
      OR 
      -- Case 2: Task has no project but is assigned to or created by someone in the entreprise
      EXISTS (
        SELECT 1 FROM users u 
        WHERE (u.id = tasks.assigned_to OR u.id = tasks.created_by) 
        AND u.entreprise_id = auth_user_entreprise()
      )
    )
  );

-- 3. Ensure Team Manager Select Policy is robust for those without projects
DROP POLICY IF EXISTS "tasks_manager_basic_select" ON tasks;
CREATE POLICY "tasks_manager_basic_select"
  ON tasks FOR SELECT
  USING (
    is_manager() AND (
      EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND p.entreprise_id = auth_user_entreprise())
      OR
      EXISTS (SELECT 1 FROM user_details ud WHERE ud.id_user = tasks.assigned_to AND ud.reports_to = auth.uid())
      OR
      created_by = auth.uid()
      OR
      assigned_to = auth.uid()
    )
  );
