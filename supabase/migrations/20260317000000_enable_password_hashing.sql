-- Password Hashing Migration (Fixed Version + Schema Qualified)
-- 1. Enable pgcrypto for crypt/gen_salt
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Use a unified DO block with EXECUTE to handle schema changes and updates
-- This avoids "column does not exist" parsing errors in the same script.
DO $$ 
BEGIN
  -- A. RENAME/ADD COLUMNS TO STANDARDIZE ON password_hash
  
  -- Employees
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'password') THEN
    ALTER TABLE public.employees RENAME COLUMN password TO password_hash;
  END IF;

  -- Team Manager Profiles
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'team_manager_profiles' AND column_name = 'password') THEN
    ALTER TABLE public.team_manager_profiles RENAME COLUMN password TO password_hash;
  END IF;

  -- Owners (Super Admin)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'owners' AND column_name = 'password') THEN
    ALTER TABLE public.owners RENAME COLUMN password TO password_hash;
  END IF;
  
  -- Ensure admin_profiles has password_hash
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_profiles' AND column_name = 'password_hash') THEN
    ALTER TABLE public.admin_profiles ADD COLUMN password_hash TEXT;
  END IF;

  -- Ensure users has password_hash
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password_hash') THEN
    ALTER TABLE public.users ADD COLUMN password_hash TEXT;
  END IF;

  -- B. HASH EXISTING PLAIN-TEXT PASSWORDS
  -- We use EXECUTE to ensure the parser sees the renamed columns at runtime.
  -- We use extensions. qualifiers for crypt and gen_salt because pgcrypto is often in the extensions schema.
  
  EXECUTE 'UPDATE public.users SET password_hash = extensions.crypt(password_hash, extensions.gen_salt(''bf'')) WHERE password_hash IS NOT NULL AND password_hash NOT LIKE ''$2%''';
  EXECUTE 'UPDATE public.employees SET password_hash = extensions.crypt(password_hash, extensions.gen_salt(''bf'')) WHERE password_hash IS NOT NULL AND password_hash NOT LIKE ''$2%''';
  EXECUTE 'UPDATE public.team_manager_profiles SET password_hash = extensions.crypt(password_hash, extensions.gen_salt(''bf'')) WHERE password_hash IS NOT NULL AND password_hash NOT LIKE ''$2%''';
  EXECUTE 'UPDATE public.admin_profiles SET password_hash = extensions.crypt(password_hash, extensions.gen_salt(''bf'')) WHERE password_hash IS NOT NULL AND password_hash NOT LIKE ''$2%''';
  EXECUTE 'UPDATE public.hr_profiles SET password_hash = extensions.crypt(password_hash, extensions.gen_salt(''bf'')) WHERE password_hash IS NOT NULL AND password_hash NOT LIKE ''$2%''';
  EXECUTE 'UPDATE public.owners SET password_hash = extensions.crypt(password_hash, extensions.gen_salt(''bf'')) WHERE password_hash IS NOT NULL AND password_hash NOT LIKE ''$2%''';

END $$;

-- 3. Update verify_login to use extensions.crypt()
CREATE OR REPLACE FUNCTION "public"."verify_login"("p_email" "text", "p_password" "text") 
RETURNS JSON
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public', 'extensions'
AS $$
DECLARE
    v_user RECORD;
    v_owner RECORD;
BEGIN
  -- 1. Check the standard users table
  SELECT * INTO v_user 
  FROM public.users
  WHERE LOWER(email) = LOWER(p_email)
  LIMIT 1;

  IF FOUND THEN
      -- Use extensions.crypt to verify password
      IF v_user.password_hash IS NOT NULL AND v_user.password_hash = extensions.crypt(p_password, v_user.password_hash) THEN
          RETURN row_to_json(v_user);
      ELSE
          RETURN NULL;
      END IF;
  END IF;

  -- 2. If no user found, check the owners table (Super Admins)
  SELECT * INTO v_owner
  FROM public.owners
  WHERE LOWER(email) = LOWER(p_email)
  LIMIT 1;

  IF FOUND THEN
      -- Use extensions.crypt to verify password
      IF v_owner.password_hash IS NOT NULL AND v_owner.password_hash = extensions.crypt(p_password, v_owner.password_hash) THEN
          RETURN json_build_object(
              'id', v_owner.id,
              'entreprise_id', NULL,
              'name', v_owner.name,
              'email', v_owner.email,
              'role', 'SUPER_ADMIN',
              'status', 'active',
              'avatar_initials', SUBSTRING(v_owner.name FROM 1 FOR 2),
              'last_login_at', NULL,
              'created_at', v_owner.created_at,
              'updated_at', v_owner.updated_at
          );
      ELSE
          RETURN NULL;
      END IF;
  END IF;

  RETURN NULL;
END;
$$;

-- 4. Update update_profile_password to hash new passwords
CREATE OR REPLACE FUNCTION "public"."update_profile_password"("p_user_id" "uuid", "p_role" "text", "p_new_password" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_hashed_password TEXT;
BEGIN
  v_hashed_password := extensions.crypt(p_new_password, extensions.gen_salt('bf'));

  -- Perform the update based on the role
  IF p_role = 'HR' THEN
    UPDATE public.hr_profiles SET password_hash = v_hashed_password, password_changed = TRUE WHERE user_id = p_user_id;
  ELSIF p_role = 'EMPLOYEE' THEN
    UPDATE public.employees SET password_hash = v_hashed_password, password_changed = TRUE WHERE user_id = p_user_id;
  ELSIF p_role = 'TEAM_MANAGER' THEN
    UPDATE public.team_manager_profiles SET password_hash = v_hashed_password, password_changed = TRUE 
    WHERE employee_id = (SELECT id FROM public.employees WHERE user_id = p_user_id);
    UPDATE public.employees SET password_hash = v_hashed_password, password_changed = TRUE WHERE user_id = p_user_id;
  ELSIF p_role IN ('ADMIN', 'COMPANY_ADMIN', 'admin') THEN
    UPDATE public.admin_profiles SET password_hash = v_hashed_password WHERE user_id = p_user_id;
  ELSIF p_role = 'SUPER_ADMIN' THEN
    UPDATE public.owners SET password_hash = v_hashed_password WHERE id = p_user_id;
  END IF;

  -- Update the common flag and hash in the users table
  UPDATE public.users SET 
    password_changed = TRUE,
    password_hash = v_hashed_password
  WHERE id = p_user_id;
END;
$$;

-- 5. Update user creation RPCs to hash passwords on insert
CREATE OR REPLACE FUNCTION "public"."create_employee"("p_user_id" "uuid", "p_entreprise_id" "uuid", "p_full_name" "text", "p_email" "text", "p_avatar" "text", "p_password" "text" DEFAULT '000000'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE 
  v_employee_id UUID;
  v_hashed_password TEXT;
BEGIN
  v_hashed_password := extensions.crypt(p_password, extensions.gen_salt('bf'));

  INSERT INTO public.users (id, entreprise_id, name, email, role, status, avatar_initials, password_hash)
  VALUES (p_user_id, p_entreprise_id, p_full_name, p_email, 'EMPLOYEE', 'active', p_avatar, v_hashed_password)
  ON CONFLICT (id) DO UPDATE SET
    entreprise_id=EXCLUDED.entreprise_id, name=EXCLUDED.name,
    avatar_initials=EXCLUDED.avatar_initials, role='EMPLOYEE',
    password_hash=EXCLUDED.password_hash;

  INSERT INTO public.employees (user_id, entreprise_id, position, password_hash)
  VALUES (p_user_id, p_entreprise_id, 'Employee', v_hashed_password) RETURNING id INTO v_employee_id;

  RETURN json_build_object('success', true, 'employee_id', v_employee_id);
EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'create_employee failed: %', SQLERRM;
END; $$;

CREATE OR REPLACE FUNCTION "public"."create_hr_profile"("p_user_id" "uuid", "p_name" "text", "p_email" "text", "p_phone" "text", "p_password" "text", "p_entreprise_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_hashed_password TEXT;
BEGIN
  v_hashed_password := extensions.crypt(p_password, extensions.gen_salt('bf'));

  -- 1. Insert into public.users
  INSERT INTO public.users (id, entreprise_id, name, email, role, status, avatar_initials, password_hash)
  VALUES (
    p_user_id,
    p_entreprise_id,
    p_name,
    p_email,
    'HR',
    'active',
    UPPER(LEFT(p_name, 2)),
    v_hashed_password
  )
  ON CONFLICT (id) DO UPDATE
    SET entreprise_id = EXCLUDED.entreprise_id,
        name         = EXCLUDED.name,
        role         = EXCLUDED.role,
        status       = EXCLUDED.status,
        password_hash = EXCLUDED.password_hash;

  -- 2. Insert into public.hr_profiles
  INSERT INTO public.hr_profiles (user_id, password_hash)
  VALUES (p_user_id, v_hashed_password)
  ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."create_team_manager"("p_user_id" "uuid", "p_entreprise_id" "uuid", "p_full_name" "text", "p_email" "text", "p_avatar" "text", "p_password" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_employee_id uuid;
  v_hashed_password TEXT;
BEGIN
  v_hashed_password := extensions.crypt(p_password, extensions.gen_salt('bf'));

  INSERT INTO public.users (id, email, name, role, entreprise_id, password_hash)
  VALUES (p_user_id, p_email, p_full_name, 'TEAM_MANAGER', p_entreprise_id, v_hashed_password)
  ON CONFLICT (id) DO UPDATE set
    email = excluded.email,
    name = excluded.name,
    role = excluded.role,
    entreprise_id = excluded.entreprise_id,
    password_hash = excluded.password_hash;

  INSERT INTO public.employees (user_id, entreprise_id, position, password_hash)
  VALUES (p_user_id, p_entreprise_id, 'Team Manager', v_hashed_password)
  ON CONFLICT (user_id) DO UPDATE set
    entreprise_id = excluded.entreprise_id,
    position = excluded.position,
    password_hash = excluded.password_hash
  returning id into v_employee_id;

  INSERT INTO public.team_manager_profiles (employee_id, password_hash)
  VALUES (coalesce(v_employee_id, (select id from employees where user_id = p_user_id)), v_hashed_password)
  ON CONFLICT (employee_id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

  return json_build_object('success', true, 'user_id', p_user_id, 'employee_id', v_employee_id);
exception when others then
  raise exception 'Failed to create team manager: %', SQLERRM;
end;
$$;