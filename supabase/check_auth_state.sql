-- Run each SELECT separately to see what's broken

-- 1. Check triggers on auth.users
SELECT tgname, tgenabled, pg_get_triggerdef(t.oid) as def
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' AND c.relname = 'users';

-- 2. Check if auth.users table is accessible
SELECT count(*) as auth_user_count FROM auth.users;

-- 3. Check for any broken views in auth schema
SELECT viewname, definition FROM pg_views WHERE schemaname = 'auth';

-- 4. Check auth hooks table
SELECT * FROM auth.hooks LIMIT 10;

-- 5. Check for any invalid functions that reference auth
SELECT p.proname, p.prosrc
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosrc ILIKE '%auth.users%';
