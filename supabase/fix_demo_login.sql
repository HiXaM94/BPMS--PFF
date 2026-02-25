-- ================================================================
-- FIX: Demo login "Database error querying schema"
-- Run this in Supabase Dashboard → SQL Editor
-- ================================================================

-- Step 1: Check what's in public.users for our demo accounts
SELECT id, email, role, entreprise_id, status FROM public.users
WHERE id IN (
  'aaaaaaaa-0001-0001-0001-000000000001',
  'aaaaaaaa-0004-0004-0004-000000000004',
  'aaaaaaaa-0005-0005-0005-000000000005',
  'aaaaaaaa-0003-0003-0003-000000000003'
);

-- Step 2: Fix the public.users rows — make sure they have correct
-- entreprise_id, role, and email matching the auth users
UPDATE public.users SET
  entreprise_id = '11111111-0001-0001-0001-000000000001',
  email = 'admin@techcorp.ma',
  name = 'Ibrahim Rouass',
  role = 'ADMIN',
  status = 'active'
WHERE id = 'aaaaaaaa-0001-0001-0001-000000000001';

UPDATE public.users SET
  entreprise_id = '11111111-0001-0001-0001-000000000001',
  email = 'hr@techcorp.ma',
  name = 'Fatima Zahra El Amrani',
  role = 'HR',
  status = 'active'
WHERE id = 'aaaaaaaa-0004-0004-0004-000000000004';

UPDATE public.users SET
  entreprise_id = '11111111-0001-0001-0001-000000000001',
  email = 'manager@techcorp.ma',
  name = 'Youssef Bennani',
  role = 'TEAM_MANAGER',
  status = 'active'
WHERE id = 'aaaaaaaa-0005-0005-0005-000000000005';

UPDATE public.users SET
  entreprise_id = '11111111-0001-0001-0001-000000000001',
  email = 'employee@techcorp.ma',
  name = 'Ahmed Hassan',
  role = 'EMPLOYEE',
  status = 'active'
WHERE id = 'aaaaaaaa-0003-0003-0003-000000000003';

-- Step 3: Notify PostgREST to reload its schema cache
-- This fixes "Database error querying schema"
NOTIFY pgrst, 'reload schema';

-- Step 4: Verify the fix
SELECT id, email, role, entreprise_id, status FROM public.users
WHERE email IN ('admin@techcorp.ma', 'hr@techcorp.ma', 'manager@techcorp.ma', 'employee@techcorp.ma');
