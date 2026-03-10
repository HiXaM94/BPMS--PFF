-- Migration to update rpc_complete_manager_profile to include user_details.adresse saving
-- Date: 2026-03-06

CREATE OR REPLACE FUNCTION rpc_complete_manager_profile(
  p_user_id uuid,
  p_salary_base numeric,
  p_location text,
  p_cnss text,
  p_rib text,
  p_join_date date,
  p_department text,
  p_phone text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_employee_id uuid;
  v_entreprise_id uuid;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'You can only update your own manager profile.';
  END IF;

  SELECT entreprise_id INTO v_entreprise_id FROM users WHERE id = p_user_id;
  SELECT id INTO v_employee_id FROM employees WHERE user_id = p_user_id;

  IF v_employee_id IS NULL THEN
    RAISE EXCEPTION 'Employee record missing; ask HR to initialize your profile.';
  END IF;

  -- Update user_details with adresse (localization)
  INSERT INTO user_details (id_user, cnss, rib, join_date, department, phone, adresse, entreprise_id)
    VALUES (
      p_user_id,
      p_cnss,
      p_rib,
      p_join_date,
      p_department,
      p_phone,
      p_location, -- Mapping location to adresse
      v_entreprise_id
    )
    ON CONFLICT (id_user) DO UPDATE
      SET cnss = COALESCE(excluded.cnss, user_details.cnss),
          rib = COALESCE(excluded.rib, user_details.rib),
          join_date = COALESCE(excluded.join_date, user_details.join_date),
          department = COALESCE(excluded.department, user_details.department),
          phone = COALESCE(excluded.phone, user_details.phone),
          adresse = COALESCE(excluded.adresse, user_details.adresse);

  -- Update manager specific profile
  INSERT INTO team_manager_profiles (employee_id, user_id, salary_base, location)
    VALUES (v_employee_id, p_user_id, COALESCE(p_salary_base, 0), p_location)
    ON CONFLICT (employee_id) DO UPDATE
    SET salary_base = COALESCE(excluded.salary_base, team_manager_profiles.salary_base),
        location = COALESCE(excluded.location, team_manager_profiles.location),
        user_id = COALESCE(excluded.user_id, team_manager_profiles.user_id);
END;
$$;
