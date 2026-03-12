-- =========================================================================
-- Migration: Add create_team_manager RPC for HR-managed onboarding
-- This RPC mirrors the existing employee creation flow but keeps the manager-specific data in
-- team_manager_profiles and the employees table so HR/ADMIN roles can register new managers.
-- =========================================================================

create or replace function public.create_team_manager(
  p_user_id UUID,
  p_entreprise_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_avatar TEXT,
  p_password TEXT
) returns json
language plpgsql
security definer
as $$
declare
  v_employee_id uuid;
begin
  -- 1. Maintain the users row and enforce TEAM_MANAGER role inside the RPC
  insert into public.users (id, email, name, role, entreprise_id)
  values (p_user_id, p_email, p_full_name, 'TEAM_MANAGER', p_entreprise_id)
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    role = excluded.role,
    entreprise_id = excluded.entreprise_id;

  -- 2. Ensure there is an employee record so RLS policies unlock profile fields
  insert into public.employees (user_id, entreprise_id, position)
  values (p_user_id, p_entreprise_id, 'Team Manager')
  on conflict (user_id) do update set
    entreprise_id = excluded.entreprise_id,
    position = excluded.position
  returning id into v_employee_id;

  -- 3. Seed the manager profile row (only employee_id is defined in schema)
  insert into public.team_manager_profiles (employee_id)
  values (coalesce(v_employee_id, (select id from employees where user_id = p_user_id)))
  on conflict (employee_id) do nothing;

  return json_build_object('success', true, 'user_id', p_user_id, 'employee_id', v_employee_id);
exception when others then
  raise exception 'Failed to create team manager: %', SQLERRM;
end;
$$;

grant execute on function public.create_team_manager(UUID, UUID, TEXT, TEXT, TEXT, TEXT) to authenticated;
