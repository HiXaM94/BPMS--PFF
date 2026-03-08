-- RPC to permanently delete a user from all tables and Supabase Auth
-- This function must be run with SECURITY DEFINER to have permissions to delete from auth.users

CREATE OR REPLACE FUNCTION public.rpc_delete_user_entirely(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_exists BOOLEAN;
BEGIN
    -- 1. Check if user exists in public.users (or auth.users)
    SELECT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) INTO v_user_exists;
    
    IF NOT v_user_exists THEN
        RAISE EXCEPTION 'User with ID % not found.', p_user_id;
    END IF;

    -- 2. Delete from auth.users
    -- This will trigger cascading deletes in public.users if the FK is set up with ON DELETE CASCADE.
    -- If not, we handle it manually.
    DELETE FROM auth.users WHERE id = p_user_id;

    -- 3. Explicitly delete from public.users if not cascaded
    DELETE FROM public.users WHERE id = p_user_id;
    
    -- Note: Most other tables (employees, user_details, presences, etc.) 
    -- should have ON DELETE CASCADE on their user_id FKs.

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in rpc_delete_user_entirely: %', SQLERRM;
        RETURN FALSE;
END;
$$;

-- Grant access to authenticated users (typically Admins/HR will call this via client)
-- RLS should still be considered, but RPC is a direct path.
GRANT EXECUTE ON FUNCTION public.rpc_delete_user_entirely(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_delete_user_entirely(UUID) TO service_role;
