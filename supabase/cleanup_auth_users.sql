-- ================================================================
-- CLEANUP: Remove all SQL-inserted demo auth users
-- GoTrue can't work with manually inserted auth.users rows
-- After this, use the Admin API script to create them properly
-- ================================================================

-- Remove identities first (FK constraint)
DELETE FROM auth.identities WHERE user_id IN (
  'aaaaaaaa-0001-0001-0001-000000000001',
  'aaaaaaaa-0004-0004-0004-000000000004',
  'aaaaaaaa-0005-0005-0005-000000000005',
  'aaaaaaaa-0003-0003-0003-000000000003'
);

-- Remove public.users rows
DELETE FROM public.users WHERE id IN (
  'aaaaaaaa-0001-0001-0001-000000000001',
  'aaaaaaaa-0004-0004-0004-000000000004',
  'aaaaaaaa-0005-0005-0005-000000000005',
  'aaaaaaaa-0003-0003-0003-000000000003'
);

-- Remove auth.users rows
DELETE FROM auth.users WHERE id IN (
  'aaaaaaaa-0001-0001-0001-000000000001',
  'aaaaaaaa-0004-0004-0004-000000000004',
  'aaaaaaaa-0005-0005-0005-000000000005',
  'aaaaaaaa-0003-0003-0003-000000000003'
);

-- Also remove any demo users that might have been created with these emails
DELETE FROM auth.identities WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('admin@techcorp.ma','hr@techcorp.ma','manager@techcorp.ma','employee@techcorp.ma')
);
DELETE FROM public.users WHERE email IN ('admin@techcorp.ma','hr@techcorp.ma','manager@techcorp.ma','employee@techcorp.ma');
DELETE FROM auth.users WHERE email IN ('admin@techcorp.ma','hr@techcorp.ma','manager@techcorp.ma','employee@techcorp.ma');

-- Verify cleanup
SELECT count(*) as remaining_auth FROM auth.users WHERE email IN ('admin@techcorp.ma','hr@techcorp.ma','manager@techcorp.ma','employee@techcorp.ma');
SELECT count(*) as remaining_public FROM public.users WHERE email IN ('admin@techcorp.ma','hr@techcorp.ma','manager@techcorp.ma','employee@techcorp.ma');
