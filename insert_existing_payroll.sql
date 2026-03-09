-- Insert a payroll specifically for the employee you already created!
-- Run this in your Supabase SQL Editor.

-- We assume your existing employee_id is what you created earlier:
-- user_id : 39cdf79c-6411-4f4d-9645-39b4b04eddaa
-- entreprise_id : 11111111-0001-0001-0001-000000000001

-- 1. Create a payroll record for March 2026 linked to the user's Employee ID
-- NOTE: Please replace 'PASTE_YOUR_EMPLOYEE_ID_HERE' with the actual `id` 
-- from your `employees` table for this user!

INSERT INTO payrolls (
    employee_id, 
    user_id, 
    month, 
    period_start, 
    period_end, 
    base_salary, 
    gross_salary, 
    net_salary, 
    status, 
    period
) VALUES (
    'PASTE_YOUR_EMPLOYEE_ID_HERE',       -- REPLACE THIS!
    '39cdf79c-6411-4f4d-9645-39b4b04eddaa', -- The User ID you gave me
    'March 2026', 
    '2026-03-01', 
    '2026-03-31', 
    15000, 
    15500, 
    14000, 
    'GENERATED',
    'March 2026'
);
