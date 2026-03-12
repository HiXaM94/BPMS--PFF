-- Recreate create_super_admin with parameters sorted alphabetically
-- to satisfy Supabase client's schema cache requirements.

-- drop old definition (order name,email,password)
DROP FUNCTION IF EXISTS public.create_super_admin(text, text, text);

CREATE OR REPLACE FUNCTION public.create_super_admin(
    p_email text,
    p_name text,
    p_password text
) RETURNS void AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.owners) THEN
        RAISE EXCEPTION 'a super admin already exists';
    END IF;

    INSERT INTO public.owners (name, email, password)
    VALUES (p_name, p_email, p_password);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- re-grant permissions
GRANT EXECUTE ON FUNCTION public.create_super_admin(text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_super_admin(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_super_admin(text, text, text) TO service_role;
