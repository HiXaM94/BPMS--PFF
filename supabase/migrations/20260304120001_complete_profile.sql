-- Simple RPC for employees/managers to finish onboarding
create or replace function rpc_complete_profile(
  p_user_id uuid,
  p_employee_code text,
  p_hire_date date,
  p_salary_base numeric,
  p_phone text,
  p_location text,
  p_rib text,
  p_bio text,
  p_cnss text,
  p_join_date date,
  p_department text,
  p_role text,
  p_manager_salary numeric
)
returns void
language plpgsql
security definer
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'You can only update your own onboarding data.';
  end if;

  insert into employees (user_id, entreprise_id, position, employee_code, hire_date, salary_base, phone, location, rib, bio)
    select p_user_id, entreprise_id, 'Employee', p_employee_code, coalesce(p_hire_date, current_date), coalesce(p_salary_base, 0), p_phone, p_location, p_rib, p_bio
    from users
    where id = p_user_id
    on conflict (user_id) do update
    set employee_code = coalesce(excluded.employee_code, employees.employee_code),
        hire_date = coalesce(excluded.hire_date, employees.hire_date),
        salary_base = coalesce(excluded.salary_base, employees.salary_base),
        phone = coalesce(excluded.phone, employees.phone),
        location = coalesce(excluded.location, employees.location),
        rib = coalesce(excluded.rib, employees.rib),
        bio = coalesce(excluded.bio, employees.bio)
    returning id into strict p_user_id;

  insert into user_details (id_user, cnss, rib, join_date, department, phone, entreprise_id)
    values (
      p_user_id,
      p_cnss,
      p_rib,
      p_join_date,
      p_department,
      p_phone,
      (select entreprise_id from users where id = p_user_id)
    )
    on conflict (id_user) do update
      set cnss = coalesce(excluded.cnss, user_details.cnss),
          rib = coalesce(excluded.rib, user_details.rib),
          join_date = coalesce(excluded.join_date, user_details.join_date),
          department = coalesce(excluded.department, user_details.department),
          phone = coalesce(excluded.phone, user_details.phone);

  if upper(p_role) = 'TEAM_MANAGER' then
    insert into team_manager_profiles (employee_id, salary_base)
      select employees.id, coalesce(p_manager_salary, coalesce(p_salary_base, 0))
      from employees
      where employees.user_id = p_user_id
      on conflict (employee_id) do update
      set salary_base = coalesce(excluded.salary_base, team_manager_profiles.salary_base);
  end if;
end;
$$;
