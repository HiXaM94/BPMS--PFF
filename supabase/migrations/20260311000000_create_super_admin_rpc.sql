-- RPC for initial super-admin creation
-- This should only succeed when there are no existing owners.

CREATE OR REPLACE FUNCTION public.create_super_admin(
    p_name text,
    p_email text,
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

-- grant execute to anon/authenticated so we can call from the public login page
GRANT EXECUTE ON FUNCTION public.create_super_admin(text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_super_admin(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_super_admin(text, text, text) TO service_role;
