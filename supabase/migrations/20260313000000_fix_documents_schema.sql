-- BPMS — EMERGENCY RESTORE & Fix Documents (Idempotent)
-- This script FIXES the login recursion error, adds missing columns,
-- and ensures the 'submitted' status is valid.

-- 1. 🚨 IMMEDIATE RESTORE: Fix recursion and basic login
DROP POLICY IF EXISTS "users_see_hr_select" ON public.users;
CREATE POLICY "users_see_hr_select" ON public.users
    FOR SELECT USING ((auth.uid() IS NOT NULL) AND (role IN ('HR', 'ADMIN')));

-- 2. Add 'submitted' status to existing enum if missing
DO $$ BEGIN
    ALTER TYPE document_status ADD VALUE 'submitted';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Document Table Structure Updates
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS doc_type TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS urgency TEXT,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

ALTER TABLE public.documents ALTER COLUMN type DROP NOT NULL;

-- 4. Document RLS Policies (Fixed to use helper functions)
DROP POLICY IF EXISTS "documents_self_insert" ON public.documents;
CREATE POLICY "documents_self_insert" ON public.documents 
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "documents_self_select" ON public.documents;
CREATE POLICY "documents_self_select" ON public.documents 
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "documents_self_update" ON public.documents;
CREATE POLICY "documents_self_update" ON public.documents 
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "documents_self_delete" ON public.documents;
CREATE POLICY "documents_self_delete" ON public.documents 
    FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "documents_admin_hr_all" ON public.documents;
CREATE POLICY "documents_admin_hr_all" ON public.documents 
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('HR', 'ADMIN')
    );

-- 5. Notification Fix
DROP POLICY IF EXISTS "notifications_insert_all" ON public.notifications;
CREATE POLICY "notifications_insert_all" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 6. Indexes & Sync
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_doc_type ON public.documents(doc_type);

UPDATE public.documents d
SET user_id = e.user_id, doc_type = 'onboarding'
FROM public.employees e
WHERE d.employee_id = e.id AND d.user_id IS NULL;
