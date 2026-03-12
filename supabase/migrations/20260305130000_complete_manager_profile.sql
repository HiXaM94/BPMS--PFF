-- RPC for team managers to finish onboarding data without touching `employees`
create or replace function rpc_complete_manager_profile(
  p_user_id uuid,
  p_salary_base numeric,
  p_location text,
  p_cnss text,
  p_rib text,
  p_join_date date,
  p_department text,
  p_phone text
)
returns void
language plpgsql
security definer
set local role authenticated
as $$
declare
  v_employee_id uuid;
  v_entreprise_id uuid;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'You can only update your own manager profile.';
  end if;

  select entreprise_id into v_entreprise_id from users where id = p_user_id;
  select id into v_employee_id from employees where user_id = p_user_id;

  if v_employee_id is null then
    raise exception 'Employee record missing; ask HR to initialize your profile.';
  end if;

  insert into user_details (id_user, cnss, rib, join_date, department, phone, entreprise_id)
    values (
      p_user_id,
      p_cnss,
      p_rib,
      p_join_date,
      p_department,
      p_phone,
      v_entreprise_id
    )
    on conflict (id_user) do update
      set cnss = coalesce(excluded.cnss, user_details.cnss),
          rib = coalesce(excluded.rib, user_details.rib),
          join_date = coalesce(excluded.join_date, user_details.join_date),
          department = coalesce(excluded.department, user_details.department),
          phone = coalesce(excluded.phone, user_details.phone);

  insert into team_manager_profiles (employee_id, user_id, salary_base, location)
    values (v_employee_id, p_user_id, coalesce(p_salary_base, 0), p_location)
    on conflict (employee_id) do update
    set salary_base = coalesce(excluded.salary_base, team_manager_profiles.salary_base),
        location = coalesce(excluded.location, team_manager_profiles.location),
        user_id = coalesce(excluded.user_id, team_manager_profiles.user_id);
end;
$$;
