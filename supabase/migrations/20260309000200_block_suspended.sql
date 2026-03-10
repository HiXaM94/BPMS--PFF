-- Update verify_login to return enterprise status to block suspended users
CREATE OR REPLACE FUNCTION "public"."verify_login"("p_email" "text", "p_password" "text") 
RETURNS JSON
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
DECLARE
    v_user RECORD;
    v_owner RECORD;
    v_ent_status text;
BEGIN
  -- 1. Check the standard users table
  SELECT * INTO v_user 
  FROM public.users
  WHERE LOWER(email) = LOWER(p_email)
  LIMIT 1;

  IF FOUND THEN
      -- Check enterprise status
      IF v_user.entreprise_id IS NOT NULL THEN
          SELECT status INTO v_ent_status FROM public.entreprises WHERE id = v_user.entreprise_id;
          IF v_ent_status = 'suspended' THEN
              RETURN json_build_object('suspended', true);
          END IF;
      END IF;
      RETURN row_to_json(v_user);
  END IF;

  -- 2. If no user found, check the owners table (Super Admins)
  SELECT * INTO v_owner
  FROM public.owners
  WHERE LOWER(email) = LOWER(p_email)
  LIMIT 1;

  IF FOUND THEN
      -- Return a JSON object mapped to look like a user record
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
  END IF;

  -- 3. If neither found, return NULL
  RETURN NULL;
END;
$$;
