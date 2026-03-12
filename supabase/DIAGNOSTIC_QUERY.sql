-- Run this in Supabase SQL Editor to check current schema

-- Check recrutements table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'recrutements'
ORDER BY ordinal_position;

-- Check candidates table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'candidates'
ORDER BY ordinal_position;

-- Check RLS policies on recrutements
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'recrutements';

-- Check RLS policies on candidates
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'candidates';

-- Check storage buckets
SELECT id, name, public
FROM storage.buckets
WHERE name IN ('candidate-cvs', 'documents');
