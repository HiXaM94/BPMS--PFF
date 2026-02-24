-- Create demo auth users for testing
-- Password for all demo accounts: Demo@123456
-- Note: Run this via Supabase SQL Editor

-- Admin user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  'aaaaaaaa-0001-0001-0001-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@techcorp.ma',
  '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG1vRnNHsRu', -- Demo@123456
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Ibrahim Rouass","role":"ADMIN"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
);

-- HR Manager user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  'aaaaaaaa-0004-0004-0004-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'hr@techcorp.ma',
  '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG1vRnNHsRu', -- Demo@123456
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Fatima Zahra El Amrani","role":"HR"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
);

-- Team Manager user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  'aaaaaaaa-0005-0005-0005-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'manager@techcorp.ma',
  '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG1vRnNHsRu', -- Demo@123456
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Youssef Bennani","role":"TEAM_MANAGER"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
);

-- Employee user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  'aaaaaaaa-0003-0003-0003-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'employee@techcorp.ma',
  '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG1vRnNHsRu', -- Demo@123456
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Ahmed Hassan","role":"EMPLOYEE"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
);

-- Create corresponding identities
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
  (gen_random_uuid(), 'aaaaaaaa-0001-0001-0001-000000000001', '{"sub":"aaaaaaaa-0001-0001-0001-000000000001","email":"admin@techcorp.ma"}', 'email', NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'aaaaaaaa-0004-0004-0004-000000000004', '{"sub":"aaaaaaaa-0004-0004-0004-000000000004","email":"hr@techcorp.ma"}', 'email', NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'aaaaaaaa-0005-0005-0005-000000000005', '{"sub":"aaaaaaaa-0005-0005-0005-000000000005","email":"manager@techcorp.ma"}', 'email', NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'aaaaaaaa-0003-0003-0003-000000000003', '{"sub":"aaaaaaaa-0003-0003-0003-000000000003","email":"employee@techcorp.ma"}', 'email', NOW(), NOW(), NOW());
