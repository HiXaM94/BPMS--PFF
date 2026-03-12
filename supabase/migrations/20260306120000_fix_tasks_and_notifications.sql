-- BPMS Migration: Consolidated Fix for Tasks and Projects
-- Defensively adds all required columns and sets up RLS for Managers

-- 1. Ensure 'tasks' has required columns for status and entreprise tracking
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS finished BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Ensure 'projects' has required columns for validation and assignment
ALTER TABLE projects ADD COLUMN IF NOT EXISTS valider BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_manager_assigned UUID REFERENCES users(id) ON DELETE SET NULL;

-- 3. RLS Policies for Projects
-- Allow Managers and HR to update project status (e.g., set valider = true)
DROP POLICY IF EXISTS "projects_manager_update" ON projects;
CREATE POLICY "projects_manager_update"
  ON projects FOR UPDATE
  USING (
    (is_manager() AND (team_manager_assigned = auth.uid() OR entreprise_id = auth_user_entreprise())) OR
    (is_hr() AND entreprise_id = auth_user_entreprise())
  )
  WITH CHECK (
    (is_manager() AND (team_manager_assigned = auth.uid() OR entreprise_id = auth_user_entreprise())) OR
    (is_hr() AND entreprise_id = auth_user_entreprise())
  );

-- 4. RLS Policies for Tasks (Defensive Update)
-- Ensure managers can update tasks in projects they manage
DROP POLICY IF EXISTS "tasks_manager_update_all" ON tasks;
CREATE POLICY "tasks_manager_update_all"
  ON tasks FOR UPDATE
  USING (
    (is_manager() AND (
      entreprise_id = auth_user_entreprise() OR
      EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND p.entreprise_id = auth_user_entreprise())
    )) OR
    (auth.uid() = assigned_to)
  )
  WITH CHECK (
    (is_manager() AND (
      entreprise_id = auth_user_entreprise() OR
      EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND p.entreprise_id = auth_user_entreprise())
    )) OR
    (auth.uid() = assigned_to)
  );

-- Ensure managers can insert tasks for their entreprise
DROP POLICY IF EXISTS "tasks_manager_insert_all" ON tasks;
CREATE POLICY "tasks_manager_insert_all"
  ON tasks FOR INSERT
  WITH CHECK (
    is_manager() AND (
      -- Fallback: If data has entreprise_id, check it; otherwise let it pass to use project's entreprise
      entreprise_id = auth_user_entreprise() OR
      EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND p.entreprise_id = auth_user_entreprise())
    )
  );

-- Ensure SELECT policy handles the new column too
DROP POLICY IF EXISTS "tasks_manager_select_all" ON tasks;
CREATE POLICY "tasks_manager_select_all"
  ON tasks FOR SELECT
  USING (
    (is_manager() AND (
      entreprise_id = auth_user_entreprise() OR
      EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND p.entreprise_id = auth_user_entreprise())
    )) OR
    (auth.uid() = assigned_to) OR
    is_admin_or_hr()
  );
