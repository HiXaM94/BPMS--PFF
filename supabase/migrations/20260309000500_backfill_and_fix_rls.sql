-- ============================================================
-- BPMS EMERGENCY REPAIR: USER DETAILS & RLS FIX
-- ============================================================

-- 1. BACKFILL: Create missing user_details for ANY user that doesn't have one
INSERT INTO public.user_details (id_user, entreprise_id)
SELECT id, entreprise_id 
FROM public.users
ON CONFLICT (id_user) DO NOTHING;

-- 2. SCHEMA CORRECTION: Ensure 'adresse' exists (already verified, but for safety)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_details' AND column_name='adresse') THEN
        ALTER TABLE user_details ADD COLUMN adresse TEXT;
    END IF;
END $$;

-- 3. RLS FIX: Ensure Super Admins (Owners) can see EVERYTHING
DROP POLICY IF EXISTS "user_details_super_admin_all" ON user_details;
CREATE POLICY "user_details_super_admin_all"
  ON user_details FOR ALL
  USING (EXISTS (SELECT 1 FROM owners WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM owners WHERE id = auth.uid()));

-- 4. RLS FIX: Allow HR to see details of users in their company
DROP POLICY IF EXISTS "user_details_hr_select" ON user_details;
CREATE POLICY "user_details_hr_select"
  ON user_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users current_u
      WHERE current_u.id = auth.uid() 
        AND current_u.role = 'HR'
        AND current_u.entreprise_id = user_details.entreprise_id
    )
  );

-- 5. RLS FIX: Allow Admin to see details in their company
DROP POLICY IF EXISTS "user_details_admin_select" ON user_details;
CREATE POLICY "user_details_admin_select"
  ON user_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users current_u
      WHERE current_u.id = auth.uid() 
        AND current_u.role = 'ADMIN'
        AND current_u.entreprise_id = user_details.entreprise_id
    )
  );

-- 6. TRIGGER UPDATE: Ensure handle_new_user initializes user_details (Repeat of previous for completeness)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, entreprise_id, name, email, role, status, avatar_initials)
  VALUES (
    NEW.id,
    '11111111-0001-0001-0001-000000000001',
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'EMPLOYEE'::user_role),
    'active'::user_status,
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 2))
  );

  INSERT INTO public.user_details (id_user, entreprise_id)
  VALUES (NEW.id, '11111111-0001-0001-0001-000000000001')
  ON CONFLICT (id_user) DO NOTHING;

  RETURN NEW;
END;
$$;
