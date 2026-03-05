-- ============================================================
-- RLS Policies For admin_notes
-- Fix for 403 Forbidden Error on Insert
-- ============================================================

-- First make sure RLS is enabled on the table
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- Drop any previous conflicting policies (if any)
DROP POLICY IF EXISTS "admin_notes_admin_hr_all" ON public.admin_notes;
DROP POLICY IF EXISTS "admin_notes_assigned_read" ON public.admin_notes;

-- 1. Admins and HR can do FULL CRUD (Create, Read, Update, Delete)
-- within their respective entreprise scopes.
CREATE POLICY "admin_notes_admin_hr_all"
  ON public.admin_notes FOR ALL
  USING (is_admin_or_hr() AND entreprise_id = auth_user_entreprise())
  WITH CHECK (is_admin_or_hr() AND entreprise_id = auth_user_entreprise());

-- 2. Target managers (assigned_to) or the original authors can read the notes
CREATE POLICY "admin_notes_assigned_read"
  ON public.admin_notes FOR SELECT
  USING (assigned_to = auth.uid() OR author_user_id = auth.uid());
