-- FINAL FIX: RLS Policies for Task Visibility and Team Management
-- Execute this once in your Supabase SQL Editor

-- 1. FIX user_details: Allow managers to see who reports to them
DROP POLICY IF EXISTS "user_details_manager_select" ON user_details;
CREATE POLICY "user_details_manager_select" 
  ON user_details FOR SELECT 
  USING (reports_to = auth.uid() OR id_user = auth.uid() OR is_admin_or_hr());

-- 2. FIX users: Allow managers to see basic info of their team
DROP POLICY IF EXISTS "users_manager_select" ON users;
CREATE POLICY "users_manager_select" 
  ON users FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_details ud 
      WHERE ud.id_user = users.id AND ud.reports_to = auth.uid()
    ) OR id = auth.uid() OR is_admin_or_hr()
  );

-- 3. FIX tasks: Update managers' visibility to include their team's tasks
-- This ensures that even tasks outside a project but assigned to their team are visible
DROP POLICY IF EXISTS "tasks_manager_select" ON tasks;
CREATE POLICY "tasks_manager_select"
  ON tasks FOR SELECT
  USING (
    is_manager() AND (
      project_id IS NULL OR
      EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND p.entreprise_id = auth_user_entreprise()) OR
      EXISTS (SELECT 1 FROM user_details ud WHERE ud.id_user = tasks.assigned_to AND ud.reports_to = auth.uid())
    )
  );

-- 4. FIX tasks management: Let managers create/edit tasks for their reports
DROP POLICY IF EXISTS "tasks_manager_all_reports" ON tasks;
CREATE POLICY "tasks_manager_all_reports"
  ON tasks FOR ALL
  USING (
    is_manager() AND 
    EXISTS (SELECT 1 FROM user_details ud WHERE ud.id_user = tasks.assigned_to AND ud.reports_to = auth.uid())
  )
  WITH CHECK (
    is_manager() AND 
    EXISTS (SELECT 1 FROM user_details ud WHERE ud.id_user = tasks.assigned_to AND ud.reports_to = auth.uid())
  );
