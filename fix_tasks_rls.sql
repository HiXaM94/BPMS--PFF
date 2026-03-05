-- FIX: RLS Policies for tasks table
-- Run this in the Supabase SQL Editor

-- 1. Allow Team Managers to insert tasks into projects within their entreprise
CREATE POLICY "tasks_manager_insert"
  ON tasks FOR INSERT
  WITH CHECK (
    is_manager() AND (
      project_id IS NULL OR
      EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND p.entreprise_id = auth_user_entreprise())
    )
  );

-- 2. Allow Team Managers to delete tasks within their entreprise
CREATE POLICY "tasks_manager_delete"
  ON tasks FOR DELETE
  USING (
    is_manager() AND (
      project_id IS NULL OR
      EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND p.entreprise_id = auth_user_entreprise())
    )
  );

-- 3. Allow Team Managers to update tasks within their entreprise
CREATE POLICY "tasks_manager_update"
  ON tasks FOR UPDATE
  USING (
    is_manager() AND (
      project_id IS NULL OR
      EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND p.entreprise_id = auth_user_entreprise())
    )
  )
  WITH CHECK (
    is_manager() AND (
      project_id IS NULL OR
      EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND p.entreprise_id = auth_user_entreprise())
    )
  );
