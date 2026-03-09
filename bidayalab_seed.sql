-- ============================================================
-- SCRIPT TO SEED BIDAYALAB COMPANY AND EMPLOYEES
-- Execute this directly in the Supabase SQL Editor
-- ============================================================

-- 1. Create the Bidayalab Enterprise
INSERT INTO entreprises (id, name, industry, location, status, plan, created_at) 
VALUES (
    'b1daaaaa-0000-0000-0000-000000000001', 
    'Bidayalab', 
    'Technology', 
    'Remote', 
    'active', 
    'Business', 
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Create Departments for Bidayalab
INSERT INTO departments (id, entreprise_id, name)
VALUES 
    ('d1daaaaa-0000-0000-0000-000000000001', 'b1daaaaa-0000-0000-0000-000000000001', 'Engineering'),
    ('d1daaaaa-0000-0000-0000-000000000002', 'b1daaaaa-0000-0000-0000-000000000001', 'Human Resources'),
    ('d1daaaaa-0000-0000-0000-000000000003', 'b1daaaaa-0000-0000-0000-000000000001', 'Management')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- IMPORTANT: YOU MUST CREATE THE RAW USERS IN AUTH FIRST
-- BEFORE RUNNING THIS REST OF THIS SCRIPT.
-- Because of Supabase Security, we cannot insert passwords 
-- directly via SQL.
-- ============================================================
-- Go to Authentication -> Users in Supabase Dashboard.
-- Create 3 users and set their passwords to "password123":
-- 1. hr@bidayalab.com
-- 2. admin@bidayalab.com
-- 3. employee@bidayalab.com
-- 
-- COPY THEIR UUIDS AFTER CREATING THEM AND REPLACE THE IDs BELOW:

-- Assuming you created them and got these 3 UUIDs, replace them:
-- (Uncomment and edit the below section once you have the Auth UUIDs)

-- 3. Update the Users Table to link them to Bidayalab & set Roles
UPDATE users SET entreprise_id = 'b1daaaaa-0000-0000-0000-000000000001', name = 'Bidayalab HR', role = 'HR' WHERE email = 'hr@bidayalab.com';
UPDATE users SET entreprise_id = 'b1daaaaa-0000-0000-0000-000000000001', name = 'Bidayalab Admin', role = 'ADMIN' WHERE email = 'admin@bidayalab.com';
UPDATE users SET entreprise_id = 'b1daaaaa-0000-0000-0000-000000000001', name = 'Bidayalab Employee', role = 'EMPLOYEE' WHERE email = 'employee@bidayalab.com';

-- Get their IDs (Replace these with the actual Auth UUIDs)
-- Let's assume you replaced 'YOUR-HR-ID', 'YOUR-ADMIN-ID', 'YOUR-EMP-ID' everywhere below.

-- 4. Create Employee Profiles
INSERT INTO employees (id, user_id, entreprise_id, department_id, position, hire_date, salary_base, status) VALUES
  ('e1daaaaa-0000-0000-0000-000000000001', 'YOUR-HR-ID', 'b1daaaaa-0000-0000-0000-000000000001', 'd1daaaaa-0000-0000-0000-000000000002', 'HR Manager', '2026-01-01', 18000, 'active'),
  ('e1daaaaa-0000-0000-0000-000000000002', 'YOUR-ADMIN-ID', 'b1daaaaa-0000-0000-0000-000000000001', 'd1daaaaa-0000-0000-0000-000000000003', 'Company Admin', '2026-01-01', 25000, 'active'),
  ('e1daaaaa-0000-0000-0000-000000000003', 'YOUR-EMP-ID', 'b1daaaaa-0000-0000-0000-000000000001', 'd1daaaaa-0000-0000-0000-000000000001', 'Developer', '2026-02-01', 12000, 'active');

-- 5. Add Role Profiles
INSERT INTO hr_profiles (employee_id) VALUES ('e1daaaaa-0000-0000-0000-000000000001');
INSERT INTO admin_profiles (user_id) VALUES ('YOUR-ADMIN-ID');

-- 6. Insert Test Payrolls for Bidayalab
INSERT INTO payrolls (employee_id, generated_by, month, period_start, period_end, base_salary, bonus, deductions, status) VALUES
  ('e1daaaaa-0000-0000-0000-000000000001', 'YOUR-ADMIN-ID', 'March 2026', '2026-03-01', '2026-03-31', 18000, 500, 1000, 'GENERATED'),
  ('e1daaaaa-0000-0000-0000-000000000002', 'YOUR-ADMIN-ID', 'March 2026', '2026-03-01', '2026-03-31', 25000, 0, 0, 'GENERATED'),
  ('e1daaaaa-0000-0000-0000-000000000003', 'YOUR-ADMIN-ID', 'March 2026', '2026-03-01', '2026-03-31', 12000, 2000, 500, 'GENERATED');

