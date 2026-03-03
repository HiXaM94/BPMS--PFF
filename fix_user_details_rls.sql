-- ============================================================
-- Run this in Supabase SQL Editor to fix RLS on user_details
-- ============================================================

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own details" ON public.user_details;
DROP POLICY IF EXISTS "Users can read own details" ON public.user_details;
DROP POLICY IF EXISTS "Users can update own details" ON public.user_details;

-- Recreate with UPSERT support
CREATE POLICY "Users can insert own details"
  ON public.user_details FOR INSERT
  TO authenticated
  WITH CHECK (id_user = auth.uid());

CREATE POLICY "Users can read own details"
  ON public.user_details FOR SELECT
  TO authenticated
  USING (id_user = auth.uid());

CREATE POLICY "Users can update own details"
  ON public.user_details FOR UPDATE
  TO authenticated
  USING (id_user = auth.uid());

-- Also check if entreprise_id column exists, add it if missing
ALTER TABLE public.user_details
  ADD COLUMN IF NOT EXISTS entreprise_id uuid REFERENCES public.entreprises(id);
