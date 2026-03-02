-- 🚀 COPY AND PASTE THIS ENTIRE FILE INTO THE SUPABASE SQL EDITOR AND CLICK RUN 🚀

-- Version 4: Fixed PL/pgSQL syntax error (missing END IF)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_entreprise_id uuid;
  v_role text;
  v_phone text;
  v_password text;
BEGIN
  -- Safely extract metadata
  v_entreprise_id := COALESCE(NULLIF(NEW.raw_user_meta_data->>'entreprise_id', ''), '11111111-0001-0001-0001-000000000001')::uuid;
  v_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'EMPLOYEE');
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_password := NEW.raw_user_meta_data->>'password';

  -- 1. Insert into public.users
  BEGIN
    INSERT INTO public.users (id, entreprise_id, name, email, role, status, avatar_initials)
    VALUES (
      NEW.id,
      v_entreprise_id,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      NEW.email,
      v_role::user_role,
      'active'::user_status,
      UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 2))
    )
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Failed to insert into public.users: %', SQLERRM;
  END;

  -- 2. Insert into public.employees
  BEGIN
    INSERT INTO public.employees (user_id, entreprise_id, position, phone, status, hire_date)
    VALUES (NEW.id, v_entreprise_id, v_role, v_phone, 'active', CURRENT_DATE)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Failed to insert into public.employees: %', SQLERRM;
  END;

  -- 3. Insert into public.hr_profiles (Only if HR)
  IF v_role = 'HR' THEN
    BEGIN
      DECLARE
        v_emp_id uuid;
      BEGIN
        SELECT id INTO v_emp_id FROM public.employees WHERE user_id = NEW.id;
        IF v_emp_id IS NOT NULL THEN
          INSERT INTO public.hr_profiles (employee_id)
          VALUES (v_emp_id)
          ON CONFLICT DO NOTHING;
        END IF;
      END;
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Failed to insert into public.hr_profiles: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$function$;
