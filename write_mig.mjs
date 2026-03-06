import fs from 'fs';
const sql = `-- =========================================================================
-- Migration: Update create_team_manager RPC
-- Re-adds the insertion into the \`employees\` table when creating a manager.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.create_team_manager(
  p_user_id UUID,
  p_entreprise_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_avatar TEXT,
  p_password TEXT
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Upsert users table
  INSERT INTO public.users (id, email, name, role, entreprise_id)
  VALUES (p_user_id, p_email, p_full_name, 'TEAM_MANAGER', p_entreprise_id)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    entreprise_id = EXCLUDED.entreprise_id;

  -- 2. Insert into employees table (as requested by user)
  INSERT INTO public.employees (user_id, entreprise_id, full_name, avatar, employment_status, role_specific, password, password_changed)
  VALUES (p_user_id, p_entreprise_id, p_full_name, p_avatar, 'Active', 'TEAM_MANAGER', p_password, false)
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Insert into team_manager_profiles
  INSERT INTO public.team_manager_profiles (user_id, entreprise_id, full_name, role_name, avatar, department_id, password, password_changed)
  VALUES (p_user_id, p_entreprise_id, p_full_name, 'TEAM_MANAGER', p_avatar, NULL, p_password, false)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN json_build_object('success', true, 'user_id', p_user_id);
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Failed to create team manager: %', SQLERRM;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.create_team_manager(UUID, UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
`;
fs.writeFileSync('d:/PFE/BPMS--PFF-main/supabase/migrations/202603051_update_team_manager_rpc.sql', sql, 'utf8');
console.log('Migration generated in utf-8.');
