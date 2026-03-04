-- ================================================================
-- Create demo auth users for testing
-- Password for ALL demo accounts: Demo@123456
-- Run this via Supabase Dashboard → SQL Editor
-- Safe to re-run (uses ON CONFLICT to skip existing rows)
-- ================================================================

-- Step 0: Make sure pgcrypto is available (Supabase has it by default)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 1: Remove old demo users if they exist (clean slate)
-- Delete public.users first to avoid trigger conflict
DELETE FROM public.users WHERE id IN (
  'aaaaaaaa-0001-0001-0001-000000000001',
  'aaaaaaaa-0004-0004-0004-000000000004',
  'aaaaaaaa-0005-0005-0005-000000000005',
  'aaaaaaaa-0003-0003-0003-000000000003'
);
DELETE FROM auth.users WHERE id IN (
  'aaaaaaaa-0001-0001-0001-000000000001',
  'aaaaaaaa-0004-0004-0004-000000000004',
  'aaaaaaaa-0005-0005-0005-000000000005',
  'aaaaaaaa-0003-0003-0003-000000000003'
);

-- Step 2: Insert demo auth users with properly hashed password
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
) VALUES
  -- Admin
  ('aaaaaaaa-0001-0001-0001-000000000001', '00000000-0000-0000-0000-000000000000',
   'admin@techcorp.ma', crypt('Demo@123456', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}', '{"name":"Ibrahim Rouass","role":"ADMIN"}',
   NOW(), NOW(), 'authenticated', 'authenticated'),

  -- HR Manager
  ('aaaaaaaa-0004-0004-0004-000000000004', '00000000-0000-0000-0000-000000000000',
   'hr@techcorp.ma', crypt('Demo@123456', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}', '{"name":"Fatima Zahra El Amrani","role":"HR"}',
   NOW(), NOW(), 'authenticated', 'authenticated'),

  -- Team Manager
  ('aaaaaaaa-0005-0005-0005-000000000005', '00000000-0000-0000-0000-000000000000',
   'manager@techcorp.ma', crypt('Demo@123456', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}', '{"name":"Youssef Bennani","role":"TEAM_MANAGER"}',
   NOW(), NOW(), 'authenticated', 'authenticated'),

  -- Employee
  ('aaaaaaaa-0003-0003-0003-000000000003', '00000000-0000-0000-0000-000000000000',
   'employee@techcorp.ma', crypt('Demo@123456', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}', '{"name":"Ahmed Hassan","role":"EMPLOYEE"}',
   NOW(), NOW(), 'authenticated', 'authenticated');

-- Step 3: Create corresponding identities (required for email login to work)
DELETE FROM auth.identities WHERE user_id IN (
  'aaaaaaaa-0001-0001-0001-000000000001',
  'aaaaaaaa-0004-0004-0004-000000000004',
  'aaaaaaaa-0005-0005-0005-000000000005',
  'aaaaaaaa-0003-0003-0003-000000000003'
);
INSERT INTO auth.identities (
  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES
  (gen_random_uuid(), 'aaaaaaaa-0001-0001-0001-000000000001', 'aaaaaaaa-0001-0001-0001-000000000001',
   '{"sub":"aaaaaaaa-0001-0001-0001-000000000001","email":"admin@techcorp.ma"}',
   'email', NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'aaaaaaaa-0004-0004-0004-000000000004', 'aaaaaaaa-0004-0004-0004-000000000004',
   '{"sub":"aaaaaaaa-0004-0004-0004-000000000004","email":"hr@techcorp.ma"}',
   'email', NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'aaaaaaaa-0005-0005-0005-000000000005', 'aaaaaaaa-0005-0005-0005-000000000005',
   '{"sub":"aaaaaaaa-0005-0005-0005-000000000005","email":"manager@techcorp.ma"}',
   'email', NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'aaaaaaaa-0003-0003-0003-000000000003', 'aaaaaaaa-0003-0003-0003-000000000003',
   '{"sub":"aaaaaaaa-0003-0003-0003-000000000003","email":"employee@techcorp.ma"}',
   'email', NOW(), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Note: Step 4 (public.users) is NOT needed — the handle_new_user() trigger
-- automatically creates public.users rows when auth.users are inserted.

-- Done! You can now log in with any of these accounts using password: Demo@123456
