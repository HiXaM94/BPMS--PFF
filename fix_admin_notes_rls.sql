-- ============================================================
-- Fix RLS Policies for admin_notes table
-- ============================================================

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- Clean up any existing policies
DROP POLICY IF EXISTS "admin_notes_admin_hr_all" ON public.admin_notes;
DROP POLICY IF EXISTS "admin_notes_assigned_read" ON public.admin_notes;
DROP POLICY IF EXISTS "admin_notes_insert" ON public.admin_notes;
DROP POLICY IF EXISTS "admin_notes_select" ON public.admin_notes;
DROP POLICY IF EXISTS "admin_notes_update" ON public.admin_notes;
DROP POLICY IF EXISTS "admin_notes_delete" ON public.admin_notes;

-- 1. Allow inserting notes (You can only insert if you are the author)
CREATE POLICY "admin_notes_insert"
  ON public.admin_notes FOR INSERT
  WITH CHECK (author_user_id = auth.uid());

-- 2. Allow reading notes (You can read if you wrote it, it is assigned to you, or you are an admin in the same company)
CREATE POLICY "admin_notes_select"
  ON public.admin_notes FOR SELECT
  USING (
    author_user_id = auth.uid() OR 
    assigned_to = auth.uid() OR 
    entreprise_id = (SELECT entreprise_id FROM public.users WHERE id = auth.uid())
  );

-- 3. Allow updating notes (You can only update your own notes)
CREATE POLICY "admin_notes_update"
  ON public.admin_notes FOR UPDATE
  USING (author_user_id = auth.uid())
  WITH CHECK (author_user_id = auth.uid());
  
-- 4. Allow deleting notes (You can only delete your own notes)
CREATE POLICY "admin_notes_delete"
  ON public.admin_notes FOR DELETE
  USING (author_user_id = auth.uid());
