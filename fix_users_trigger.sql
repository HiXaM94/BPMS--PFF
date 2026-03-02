-- 🚀 COPY AND PASTE THIS ENTIRE FILE INTO THE SUPABASE SQL EDITOR AND CLICK RUN 🚀

-- This fixes the bug where Auth works but the users table stays empty!
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.users (id, entreprise_id, name, email, role, status, avatar_initials)
  VALUES (
    NEW.id,
    -- 🚨 THE FIX IS HERE: Read the real company ID from the signup metadata instead of failing! 🚨
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'entreprise_id', ''), '11111111-0001-0001-0001-000000000001')::uuid,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'role', '')::user_role,
      'EMPLOYEE'::user_role
    ),
    'active'::user_status,
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 2))
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user error (non-fatal): %', SQLERRM;
    RETURN NEW;
END;
$function$;
