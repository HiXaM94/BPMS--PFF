-- Enhance update_profile_password to support ADMIN roles and ensure universal password_changed flag update
DROP FUNCTION IF EXISTS "public"."update_profile_password"("p_user_id" "uuid", "p_role" "text", "p_new_password" "text");

CREATE OR REPLACE FUNCTION "public"."update_profile_password"("p_user_id" "uuid", "p_role" "text", "p_new_password" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- 1. Perform the update based on the role
  IF p_role = 'HR' THEN
    UPDATE public.hr_profiles SET password_hash = p_new_password, password_changed = TRUE WHERE user_id = p_user_id;
  ELSIF p_role = 'EMPLOYEE' THEN
    UPDATE public.employees SET password = p_new_password, password_changed = TRUE WHERE user_id = p_user_id;
  ELSIF p_role = 'TEAM_MANAGER' THEN
    -- Team Manager password might be duplicated in employees and team_manager_profiles
    UPDATE public.team_manager_profiles SET password = p_new_password, password_changed = TRUE 
    WHERE employee_id = (SELECT id FROM public.employees WHERE user_id = p_user_id);
    UPDATE public.employees SET password = p_new_password, password_changed = TRUE WHERE user_id = p_user_id;
  ELSIF p_role IN ('ADMIN', 'COMPANY_ADMIN', 'admin') THEN
    UPDATE public.admin_profiles SET password_hash = p_new_password WHERE user_id = p_user_id;
  ELSIF p_role = 'SUPER_ADMIN' THEN
    UPDATE public.owners SET password_hash = p_new_password WHERE id = p_user_id;
  END IF;

  -- 2. Update the common flag and hash in the users table
  UPDATE public.users SET 
    password_changed = TRUE,
    password_hash = p_new_password
  WHERE id = p_user_id;
END;
$$;
