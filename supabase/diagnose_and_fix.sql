-- ================================================================
-- DIAGNOSE AND FIX: "Database error querying schema" on login
-- Run this in Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. Show all triggers on auth.users
SELECT tgname, tgenabled, pg_get_triggerdef(t.oid) as def
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' AND c.relname = 'users';

-- 2. Show all functions in public schema that might be broken
SELECT proname, prosrc
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND proname IN ('handle_new_user','auth_user_role','auth_user_entreprise','is_admin','is_hr','is_manager');

-- 3. Check for any invalid/broken views that PostgREST introspects
SELECT schemaname, viewname
FROM pg_views
WHERE schemaname = 'public';

-- 4. Check RLS policies that might be broken
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
