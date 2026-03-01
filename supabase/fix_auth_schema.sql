-- ================================================================
-- FIX: "Database error checking email" in GoTrue
-- This error means a trigger on auth.users is crashing GoTrue
-- Run this in Supabase Dashboard → SQL Editor
-- ================================================================

-- Step 1: Find ALL triggers on auth.users (including internal ones)
SELECT tgname, tgenabled, tgtype,
       pg_get_triggerdef(t.oid) as definition
FROM pg_trigger t 
JOIN pg_class c ON t.tgrelid = c.oid 
JOIN pg_namespace n ON c.relnamespace = n.oid 
WHERE n.nspname = 'auth' AND c.relname = 'users'
ORDER BY tgname;
