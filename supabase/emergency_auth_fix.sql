-- ================================================================
-- EMERGENCY: Check what's broken in auth schema
-- Run each block separately in SQL Editor
-- ================================================================

-- BLOCK 1: Check auth.users structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- BLOCK 2: Check for NULL aud/role on existing users
SELECT id, email, aud, role, deleted_at, banned_until,
       confirmation_token, recovery_token
FROM auth.users
WHERE aud IS NULL OR role IS NULL OR aud = '' OR role = '';

-- BLOCK 3: Check all triggers on auth.users
SELECT tgname, tgenabled, tgtype,
       pg_get_triggerdef(t.oid) as definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' AND c.relname = 'users';

-- BLOCK 4: Check auth hooks table (if it exists)
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'auth' AND table_name = 'hooks';

-- BLOCK 5: Check for any broken indexes on auth.users
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'auth' AND tablename = 'users';
