-- BPMS Seed Data — Part 1: Core entities
-- Run schema.sql and rls_policies.sql FIRST.
--
-- NOTE: users.id is a FK to auth.users(id).
-- For demo/dev seeding we temporarily drop that constraint,
-- insert mock users, then restore it.
-- In production, create real auth users via Supabase Auth first.

-- Drop FK so we can insert mock user rows freely
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- ENTREPRISES
INSERT INTO entreprises (id, name, industry, phone, email, location, status, plan, created_at) VALUES
  ('11111111-0001-0001-0001-000000000001','TechCorp International','Technology',  '+212 522 123 456','contact@techcorp.ma', 'Casablanca, Morocco','active',   'Enterprise','2025-01-15 00:00:00+00'),
  ('11111111-0002-0002-0002-000000000002','FinServe Global',       'Finance',     '+212 537 654 321','info@finserve.ma',    'Rabat, Morocco',    'active',   'Business',  '2025-03-08 00:00:00+00'),
  ('11111111-0003-0003-0003-000000000003','MediCare Plus',         'Healthcare',  '+212 524 789 012','hello@medicare.ma',   'Marrakech, Morocco','active',   'Enterprise','2025-06-22 00:00:00+00'),
  ('11111111-0004-0004-0004-000000000004','EduLearn Academy',      'Education',   '+212 535 345 678','admin@edulearn.ma',   'Fes, Morocco',      'trial',    'Starter',   '2025-11-03 00:00:00+00'),
  ('11111111-0005-0005-0005-000000000005','RetailMax Holdings',    'Retail',      '+212 539 901 234','ops@retailmax.ma',    'Tangier, Morocco',  'active',   'Business',  '2025-09-14 00:00:00+00'),
  ('11111111-0006-0006-0006-000000000006','BuildPro Services',     'Construction','+212 528 567 890','info@buildpro.ma',    'Agadir, Morocco',   'suspended','Starter',   '2025-12-01 00:00:00+00'),
  ('11111111-0007-0007-0007-000000000007','LogiTrans SARL',        'Logistics',   '+212 537 234 567','contact@logitrans.ma','Kenitra, Morocco',  'active',   'Business',  '2026-02-10 00:00:00+00');

-- DEPARTMENTS (TechCorp)
INSERT INTO departments (id, entreprise_id, name) VALUES
  ('22222222-0001-0001-0001-000000000001','11111111-0001-0001-0001-000000000001','Engineering'),
  ('22222222-0002-0002-0002-000000000002','11111111-0001-0001-0001-000000000001','Marketing'),
  ('22222222-0003-0003-0003-000000000003','11111111-0001-0001-0001-000000000001','Human Resources'),
  ('22222222-0004-0004-0004-000000000004','11111111-0001-0001-0001-000000000001','Design'),
  ('22222222-0005-0005-0005-000000000005','11111111-0001-0001-0001-000000000001','Finance'),
  ('22222222-0006-0006-0006-000000000006','11111111-0001-0001-0001-000000000001','QA'),
  ('22222222-0007-0007-0007-000000000007','11111111-0001-0001-0001-000000000001','Sales'),
  ('22222222-0008-0008-0008-000000000008','11111111-0001-0001-0001-000000000001','Operations'),
  ('22222222-0009-0009-0009-000000000009','11111111-0001-0001-0001-000000000001','Analytics');

-- USERS
INSERT INTO users (id, entreprise_id, name, email, role, status, avatar_initials) VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001','11111111-0001-0001-0001-000000000001','Ibrahim Rouass','ibrahim@bpms.io', 'ADMIN',       'active',  'IR'),
  ('aaaaaaaa-0002-0002-0002-000000000002','11111111-0001-0001-0001-000000000001','Sarah Martinez','sarah.m@bpms.io', 'TEAM_MANAGER','active',  'SM'),
  ('aaaaaaaa-0003-0003-0003-000000000003','11111111-0001-0001-0001-000000000001','Ahmed Hassan',  'ahmed.h@bpms.io', 'EMPLOYEE',    'active',  'AH'),
  ('aaaaaaaa-0004-0004-0004-000000000004','11111111-0001-0001-0001-000000000001','Clara Dupont',  'clara.d@bpms.io', 'HR',          'active',  'CD'),
  ('aaaaaaaa-0005-0005-0005-000000000005','11111111-0001-0001-0001-000000000001','John Chen',     'john.c@bpms.io',  'EMPLOYEE',    'inactive','JC'),
  ('aaaaaaaa-0006-0006-0006-000000000006','11111111-0001-0001-0001-000000000001','Fatima Zahra',  'fatima.z@bpms.io','TEAM_MANAGER','active',  'FZ'),
  ('aaaaaaaa-0007-0007-0007-000000000007','11111111-0001-0001-0001-000000000001','Bob Tanaka',    'bob.t@bpms.io',   'EMPLOYEE',    'active',  'BT'),
  ('aaaaaaaa-0008-0008-0008-000000000008','11111111-0001-0001-0001-000000000001','Diana Kim',     'diana.k@bpms.io', 'EMPLOYEE',    'pending', 'DK'),
  ('aaaaaaaa-0009-0009-0009-000000000009','11111111-0001-0001-0001-000000000001','Carlos Ruiz',   'carlos.r@bpms.io','EMPLOYEE',    'active',  'CR'),
  ('aaaaaaaa-0010-0010-0010-000000000010','11111111-0001-0001-0001-000000000001','Amira Belkacem','amira.b@bpms.io', 'EMPLOYEE',    'active',  'AB');

-- EMPLOYEES
INSERT INTO employees (id,user_id,entreprise_id,department_id,manager_id,employee_code,position,hire_date,salary_base,phone,location,cnss,rib,status) VALUES
  ('bbbbbbbb-0001-0001-0001-000000000001','aaaaaaaa-0001-0001-0001-000000000001','11111111-0001-0001-0001-000000000001','22222222-0001-0001-0001-000000000001',NULL,'EMP-2025-001','Senior Full Stack Developer','2025-01-15',18000,'+212 661 123 456','Casablanca','1234567890','MA76 0011 1110 0000 0123 4567 890','active'),
  ('bbbbbbbb-0002-0002-0002-000000000002','aaaaaaaa-0002-0002-0002-000000000002','11111111-0001-0001-0001-000000000001','22222222-0002-0002-0002-000000000002','bbbbbbbb-0001-0001-0001-000000000001','EMP-2025-002','Marketing Manager','2025-03-01',16000,'+212 662 234 567','Rabat','2345678901','MA76 0022 2220 0000 0234 5678 901','active'),
  ('bbbbbbbb-0003-0003-0003-000000000003','aaaaaaaa-0003-0003-0003-000000000003','11111111-0001-0001-0001-000000000001','22222222-0001-0001-0001-000000000001','bbbbbbbb-0001-0001-0001-000000000001','EMP-2025-003','Data Analyst','2025-02-10',14000,'+212 663 345 678','Casablanca','3456789012','MA76 0033 3330 0000 0345 6789 012','active'),
  ('bbbbbbbb-0004-0004-0004-000000000004','aaaaaaaa-0004-0004-0004-000000000004','11111111-0001-0001-0001-000000000001','22222222-0003-0003-0003-000000000003','bbbbbbbb-0001-0001-0001-000000000001','EMP-2025-004','HR Specialist','2025-04-15',13000,'+212 664 456 789','Casablanca','4567890123','MA76 0044 4440 0000 0456 7890 123','active'),
  ('bbbbbbbb-0005-0005-0005-000000000005','aaaaaaaa-0005-0005-0005-000000000005','11111111-0001-0001-0001-000000000001','22222222-0004-0004-0004-000000000004','bbbbbbbb-0002-0002-0002-000000000002','EMP-2025-005','UI/UX Designer','2025-05-01',12000,'+212 665 567 890','Casablanca','5678901234','MA76 0055 5550 0000 0567 8901 234','inactive'),
  ('bbbbbbbb-0006-0006-0006-000000000006','aaaaaaaa-0006-0006-0006-000000000006','11111111-0001-0001-0001-000000000001','22222222-0006-0006-0006-000000000006','bbbbbbbb-0001-0001-0001-000000000001','EMP-2025-006','QA Engineer','2025-06-01',15000,'+212 666 678 901','Casablanca','6789012345','MA76 0066 6660 0000 0678 9012 345','active'),
  ('bbbbbbbb-0007-0007-0007-000000000007','aaaaaaaa-0007-0007-0007-000000000007','11111111-0001-0001-0001-000000000001','22222222-0001-0001-0001-000000000001','bbbbbbbb-0001-0001-0001-000000000001','EMP-2025-007','Backend Developer','2025-07-01',15500,'+212 667 789 012','Casablanca','7890123456','MA76 0077 7770 0000 0789 0123 456','active'),
  ('bbbbbbbb-0008-0008-0008-000000000008','aaaaaaaa-0008-0008-0008-000000000008','11111111-0001-0001-0001-000000000001','22222222-0001-0001-0001-000000000001','bbbbbbbb-0001-0001-0001-000000000001','EMP-2025-008','Frontend Developer','2025-08-01',14500,'+212 668 890 123','Casablanca','8901234567','MA76 0088 8880 0000 0890 1234 567','pending'),
  ('bbbbbbbb-0009-0009-0009-000000000009','aaaaaaaa-0009-0009-0009-000000000009','11111111-0001-0001-0001-000000000001','22222222-0004-0004-0004-000000000004','bbbbbbbb-0002-0002-0002-000000000002','EMP-2025-009','UI/UX Designer','2025-09-01',13500,'+212 669 901 234','Casablanca','9012345678','MA76 0099 9990 0000 0901 2345 678','active'),
  ('bbbbbbbb-0010-0010-0010-000000000010','aaaaaaaa-0010-0010-0010-000000000010','11111111-0001-0001-0001-000000000001','22222222-0005-0005-0005-000000000005','bbbbbbbb-0001-0001-0001-000000000001','EMP-2025-010','Financial Analyst','2025-10-01',14000,'+212 670 012 345','Casablanca','0123456789','MA76 0100 0000 0000 1012 3456 789','active');

-- ROLE PROFILES
INSERT INTO admin_profiles (user_id) VALUES ('aaaaaaaa-0001-0001-0001-000000000001');
INSERT INTO hr_profiles (employee_id) VALUES ('bbbbbbbb-0004-0004-0004-000000000004');
INSERT INTO team_manager_profiles (employee_id) VALUES
  ('bbbbbbbb-0002-0002-0002-000000000002'),
  ('bbbbbbbb-0006-0006-0006-000000000006');

-- EMPLOYEE SKILLS
INSERT INTO employee_skills (employee_id, name, level) VALUES
  ('bbbbbbbb-0001-0001-0001-000000000001','React.js',95),('bbbbbbbb-0001-0001-0001-000000000001','Node.js',88),
  ('bbbbbbbb-0001-0001-0001-000000000001','TypeScript',82),('bbbbbbbb-0001-0001-0001-000000000001','PostgreSQL',78),
  ('bbbbbbbb-0002-0002-0002-000000000002','SEO/SEM',92),('bbbbbbbb-0002-0002-0002-000000000002','Content Strategy',88),
  ('bbbbbbbb-0002-0002-0002-000000000002','Google Analytics',85),('bbbbbbbb-0002-0002-0002-000000000002','Social Media',90),
  ('bbbbbbbb-0003-0003-0003-000000000003','Python',90),('bbbbbbbb-0003-0003-0003-000000000003','SQL',85),
  ('bbbbbbbb-0003-0003-0003-000000000003','Power BI',80),('bbbbbbbb-0003-0003-0003-000000000003','Excel',92),
  ('bbbbbbbb-0007-0007-0007-000000000007','Java',88),('bbbbbbbb-0007-0007-0007-000000000007','Spring Boot',82),
  ('bbbbbbbb-0007-0007-0007-000000000007','Docker',75),('bbbbbbbb-0008-0008-0008-000000000008','Vue.js',85),
  ('bbbbbbbb-0008-0008-0008-000000000008','CSS/SCSS',90),('bbbbbbbb-0009-0009-0009-000000000009','Figma',95),
  ('bbbbbbbb-0009-0009-0009-000000000009','Adobe XD',88),('bbbbbbbb-0010-0010-0010-000000000010','Financial Modeling',87),
  ('bbbbbbbb-0010-0010-0010-000000000010','Excel',95);

-- EMPLOYEE CERTIFICATIONS
INSERT INTO employee_certifications (employee_id, name, issuer, issued_date, status) VALUES
  ('bbbbbbbb-0001-0001-0001-000000000001','AWS Solutions Architect','Amazon','2025-03-01','active'),
  ('bbbbbbbb-0001-0001-0001-000000000001','React Advanced Patterns','Ynov Campus','2025-09-01','active'),
  ('bbbbbbbb-0002-0002-0002-000000000002','Google Analytics Certified','Google','2025-06-01','active'),
  ('bbbbbbbb-0003-0003-0003-000000000003','Google Data Analytics','Google','2025-06-01','active'),
  ('bbbbbbbb-0003-0003-0003-000000000003','Power BI Data Analyst','Microsoft','2025-10-01','active'),
  ('bbbbbbbb-0007-0007-0007-000000000007','Oracle Java SE 11','Oracle','2025-04-01','active'),
  ('bbbbbbbb-0009-0009-0009-000000000009','Google UX Design','Google','2025-08-01','active');

-- PROJECTS
INSERT INTO projects (id,entreprise_id,department_id,manager_id,title,description,status,progress,start_date,end_date) VALUES
  ('cccccccc-0001-0001-0001-000000000001','11111111-0001-0001-0001-000000000001','22222222-0001-0001-0001-000000000001','bbbbbbbb-0001-0001-0001-000000000001','BPMS Platform v2.0','Next-generation BPMS platform rebuild','In Progress',65,'2025-10-01','2026-06-30'),
  ('cccccccc-0002-0002-0002-000000000002','11111111-0001-0001-0001-000000000001','22222222-0002-0002-0002-000000000002','bbbbbbbb-0002-0002-0002-000000000002','Q1 Marketing Campaign','Digital marketing campaign for Q1 2026','In Progress',40,'2026-01-01','2026-03-31'),
  ('cccccccc-0003-0003-0003-000000000003','11111111-0001-0001-0001-000000000001','22222222-0001-0001-0001-000000000001','bbbbbbbb-0001-0001-0001-000000000001','API Integration Layer','Backend API integration services','Planned',0,'2026-03-01','2026-08-31'),
  ('cccccccc-0004-0004-0004-000000000004','11111111-0001-0001-0001-000000000001','22222222-0006-0006-0006-000000000006','bbbbbbbb-0006-0006-0006-000000000006','QA Automation Suite','Automated testing framework','In Progress',30,'2025-11-01','2026-04-30');

-- TASKS
INSERT INTO tasks (id,project_id,assignee_id,created_by,title,description,priority,status,validation_status,deadline) VALUES
  ('dddddddd-0001-0001-0001-000000000001','cccccccc-0001-0001-0001-000000000001','bbbbbbbb-0003-0003-0003-000000000003','aaaaaaaa-0001-0001-0001-000000000001','Review Q4 Financial Report','Review and validate Q4 financial data','High','IN_PROGRESS','NONE','2026-02-14'),
  ('dddddddd-0002-0002-0002-000000000002','cccccccc-0001-0001-0001-000000000001','bbbbbbbb-0003-0003-0003-000000000003','aaaaaaaa-0001-0001-0001-000000000001','Submit timesheet approval','Weekly timesheet submission','Medium','NOT_STARTED','NONE','2026-02-15'),
  ('dddddddd-0003-0003-0003-000000000003','cccccccc-0001-0001-0001-000000000001','bbbbbbbb-0003-0003-0003-000000000003','aaaaaaaa-0001-0001-0001-000000000001','Update project documentation','Update all project docs for sprint','Low','NOT_STARTED','NONE','2026-02-18'),
  ('dddddddd-0004-0004-0004-000000000004','cccccccc-0001-0001-0001-000000000001','bbbbbbbb-0003-0003-0003-000000000003','aaaaaaaa-0001-0001-0001-000000000001','Complete security training','Mandatory security awareness module','High','NOT_STARTED','NONE','2026-02-20'),
  ('dddddddd-0005-0005-0005-000000000005','cccccccc-0001-0001-0001-000000000001','bbbbbbbb-0003-0003-0003-000000000003','aaaaaaaa-0001-0001-0001-000000000001','Code review PR #247','Review pull request before merge','Medium','IN_PROGRESS','NONE','2026-02-14'),
  ('dddddddd-0006-0006-0006-000000000006','cccccccc-0001-0001-0001-000000000001','bbbbbbbb-0003-0003-0003-000000000003','aaaaaaaa-0001-0001-0001-000000000001','Prepare sprint demo','Prepare demo for sprint review meeting','Medium','NOT_STARTED','NONE','2026-02-16'),
  ('dddddddd-0007-0007-0007-000000000007','cccccccc-0001-0001-0001-000000000001','bbbbbbbb-0007-0007-0007-000000000007','aaaaaaaa-0001-0001-0001-000000000001','Deploy staging environment','Deploy latest build to staging server','High','COMPLETED','PENDING','2026-02-10'),
  ('dddddddd-0008-0008-0008-000000000008','cccccccc-0001-0001-0001-000000000001','bbbbbbbb-0007-0007-0007-000000000007','aaaaaaaa-0001-0001-0001-000000000001','API Authentication module','Implement JWT auth for REST API','High','IN_PROGRESS','NONE','2026-02-20'),
  ('dddddddd-0009-0009-0009-000000000009','cccccccc-0004-0004-0004-000000000004','bbbbbbbb-0006-0006-0006-000000000006','aaaaaaaa-0006-0006-0006-000000000006','Write E2E test suite','Implement end-to-end tests with Playwright','High','IN_PROGRESS','NONE','2026-03-01'),
  ('dddddddd-0010-0010-0010-000000000010','cccccccc-0002-0002-0002-000000000002','bbbbbbbb-0009-0009-0009-000000000009','aaaaaaaa-0002-0002-0002-000000000002','Design campaign landing page','Create landing page mockups for Q1 campaign','Medium','COMPLETED','VALIDATED','2026-01-25'),
  ('dddddddd-0011-0011-0011-000000000011','cccccccc-0002-0002-0002-000000000002','bbbbbbbb-0002-0002-0002-000000000002','aaaaaaaa-0002-0002-0002-000000000002','Social media content plan','Plan Q1 social media content calendar','Medium','IN_PROGRESS','NONE','2026-02-28'),
  ('dddddddd-0012-0012-0012-000000000012','cccccccc-0003-0003-0003-000000000003','bbbbbbbb-0007-0007-0007-000000000007','aaaaaaaa-0001-0001-0001-000000000001','Design API architecture','Design REST API architecture document','High','NOT_STARTED','NONE','2026-03-15');

-- PAYROLLS
INSERT INTO payrolls (employee_id,generated_by,month,period_start,period_end,base_salary,bonus,deductions,status,pay_date) VALUES
  ('bbbbbbbb-0001-0001-0001-000000000001','aaaaaaaa-0004-0004-0004-000000000004','January 2026', '2026-01-01','2026-01-31',18000,2500,3200,'PAID',     '2026-01-31'),
  ('bbbbbbbb-0002-0002-0002-000000000002','aaaaaaaa-0004-0004-0004-000000000004','January 2026', '2026-01-01','2026-01-31',16000,1800,2800,'PAID',     '2026-01-31'),
  ('bbbbbbbb-0003-0003-0003-000000000003','aaaaaaaa-0004-0004-0004-000000000004','January 2026', '2026-01-01','2026-01-31',14000,1000,2400,'PAID',     '2026-01-31'),
  ('bbbbbbbb-0004-0004-0004-000000000004','aaaaaaaa-0004-0004-0004-000000000004','January 2026', '2026-01-01','2026-01-31',13000, 800,2100,'PAID',     '2026-01-31'),
  ('bbbbbbbb-0006-0006-0006-000000000006','aaaaaaaa-0004-0004-0004-000000000004','January 2026', '2026-01-01','2026-01-31',15000,1200,2600,'PAID',     '2026-01-31'),
  ('bbbbbbbb-0007-0007-0007-000000000007','aaaaaaaa-0004-0004-0004-000000000004','January 2026', '2026-01-01','2026-01-31',15500,1500,2700,'PAID',     '2026-01-31'),
  ('bbbbbbbb-0009-0009-0009-000000000009','aaaaaaaa-0004-0004-0004-000000000004','January 2026', '2026-01-01','2026-01-31',13500, 800,2200,'PAID',     '2026-01-31'),
  ('bbbbbbbb-0010-0010-0010-000000000010','aaaaaaaa-0004-0004-0004-000000000004','January 2026', '2026-01-01','2026-01-31',14000,1000,2400,'PAID',     '2026-01-31'),
  ('bbbbbbbb-0001-0001-0001-000000000001','aaaaaaaa-0004-0004-0004-000000000004','February 2026','2026-02-01','2026-02-28',18000,2000,3200,'GENERATED','2026-02-28'),
  ('bbbbbbbb-0002-0002-0002-000000000002','aaaaaaaa-0004-0004-0004-000000000004','February 2026','2026-02-01','2026-02-28',16000,1500,2800,'GENERATED','2026-02-28'),
  ('bbbbbbbb-0003-0003-0003-000000000003','aaaaaaaa-0004-0004-0004-000000000004','February 2026','2026-02-01','2026-02-28',14000, 900,2400,'GENERATED','2026-02-28'),
  ('bbbbbbbb-0006-0006-0006-000000000006','aaaaaaaa-0004-0004-0004-000000000004','February 2026','2026-02-01','2026-02-28',15000,1200,2600,'GENERATED','2026-02-28'),
  ('bbbbbbbb-0007-0007-0007-000000000007','aaaaaaaa-0004-0004-0004-000000000004','February 2026','2026-02-01','2026-02-28',15500,1500,2700,'GENERATED','2026-02-28'),
  ('bbbbbbbb-0008-0008-0008-000000000008','aaaaaaaa-0004-0004-0004-000000000004','February 2026','2026-02-01','2026-02-28',14500,1100,2500,'GENERATED','2026-02-28'),
  ('bbbbbbbb-0009-0009-0009-000000000009','aaaaaaaa-0004-0004-0004-000000000004','February 2026','2026-02-01','2026-02-28',13500, 800,2200,'GENERATED','2026-02-28'),
  ('bbbbbbbb-0010-0010-0010-000000000010','aaaaaaaa-0004-0004-0004-000000000004','February 2026','2026-02-01','2026-02-28',14000,1000,2400,'GENERATED','2026-02-28');

-- PRESENCES (Attendance)
INSERT INTO presences (employee_id,date,check_in_time,check_out_time,hours_worked,overtime_hours,status) VALUES
  ('bbbbbbbb-0001-0001-0001-000000000001','2026-02-13','08:55','17:32',8.62,0.62,'present'),
  ('bbbbbbbb-0001-0001-0001-000000000001','2026-02-12','09:02','18:15',9.22,1.22,'present'),
  ('bbbbbbbb-0001-0001-0001-000000000001','2026-02-11','08:48','17:05',8.28,0.28,'present'),
  ('bbbbbbbb-0001-0001-0001-000000000001','2026-02-10','09:30','17:02',7.53,0.00,'late'),
  ('bbbbbbbb-0001-0001-0001-000000000001','2026-02-09',NULL,NULL,0.00,0.00,'absent'),
  ('bbbbbbbb-0001-0001-0001-000000000001','2026-02-07','08:45','17:00',8.25,0.25,'present'),
  ('bbbbbbbb-0001-0001-0001-000000000001','2026-02-06','09:15','17:45',8.50,0.50,'late'),
  ('bbbbbbbb-0001-0001-0001-000000000001','2026-02-05','08:30','12:00',3.50,0.00,'half-day'),
  ('bbbbbbbb-0003-0003-0003-000000000003','2026-02-13','08:30','17:00',8.50,0.50,'present'),
  ('bbbbbbbb-0003-0003-0003-000000000003','2026-02-12','08:45','17:15',8.50,0.50,'present'),
  ('bbbbbbbb-0003-0003-0003-000000000003','2026-02-11','09:00','17:00',8.00,0.00,'present'),
  ('bbbbbbbb-0007-0007-0007-000000000007','2026-02-13','08:00','17:30',9.50,1.50,'present'),
  ('bbbbbbbb-0007-0007-0007-000000000007','2026-02-12','08:15','17:00',8.75,0.75,'present'),
  ('bbbbbbbb-0007-0007-0007-000000000007','2026-02-11','10:00','17:00',7.00,0.00,'late'),
  ('bbbbbbbb-0009-0009-0009-000000000009','2026-02-13','09:00','17:00',8.00,0.00,'present'),
  ('bbbbbbbb-0009-0009-0009-000000000009','2026-02-12','09:00','17:00',8.00,0.00,'present'),
  ('bbbbbbbb-0009-0009-0009-000000000009','2026-02-11',NULL,NULL,0.00,0.00,'absent');

-- LEAVE BALANCES
INSERT INTO leave_balances (employee_id,leave_type,year,total_days,used_days) VALUES
  ('bbbbbbbb-0001-0001-0001-000000000001','Annual Leave',2026,22,8),
  ('bbbbbbbb-0001-0001-0001-000000000001','Sick Leave',  2026,10,2),
  ('bbbbbbbb-0001-0001-0001-000000000001','Remote Work', 2026,24,15),
  ('bbbbbbbb-0001-0001-0001-000000000001','Unpaid Leave',2026,10,0),
  ('bbbbbbbb-0002-0002-0002-000000000002','Annual Leave',2026,22,5),
  ('bbbbbbbb-0002-0002-0002-000000000002','Sick Leave',  2026,10,0),
  ('bbbbbbbb-0002-0002-0002-000000000002','Remote Work', 2026,24,8),
  ('bbbbbbbb-0003-0003-0003-000000000003','Annual Leave',2026,22,3),
  ('bbbbbbbb-0003-0003-0003-000000000003','Sick Leave',  2026,10,1),
  ('bbbbbbbb-0003-0003-0003-000000000003','Remote Work', 2026,24,10),
  ('bbbbbbbb-0006-0006-0006-000000000006','Annual Leave',2026,22,0),
  ('bbbbbbbb-0006-0006-0006-000000000006','Maternity',   2026,90,90),
  ('bbbbbbbb-0007-0007-0007-000000000007','Annual Leave',2026,22,2),
  ('bbbbbbbb-0007-0007-0007-000000000007','Sick Leave',  2026,10,0),
  ('bbbbbbbb-0009-0009-0009-000000000009','Annual Leave',2026,22,4),
  ('bbbbbbbb-0009-0009-0009-000000000009','Sick Leave',  2026,10,2),
  ('bbbbbbbb-0010-0010-0010-000000000010','Annual Leave',2026,22,1),
  ('bbbbbbbb-0010-0010-0010-000000000010','Sick Leave',  2026,10,0);

-- VACANCES (Leave Requests)
INSERT INTO vacances (employee_id,approved_by,leave_type,start_date,end_date,days_count,reason,status,submitted_at) VALUES
  ('bbbbbbbb-0001-0001-0001-000000000001',NULL,                                  'Annual Leave','2026-02-20','2026-02-24',5,'Family vacation',         'PENDING', '2026-02-10 00:00:00+00'),
  ('bbbbbbbb-0002-0002-0002-000000000002','aaaaaaaa-0004-0004-0004-000000000004','Sick Leave',  '2026-02-14','2026-02-14',1,'Medical appointment',     'APPROVED','2026-02-13 00:00:00+00'),
  ('bbbbbbbb-0003-0003-0003-000000000003',NULL,                                  'Annual Leave','2026-03-03','2026-03-07',5,'Personal time off',        'PENDING', '2026-02-12 00:00:00+00'),
  ('bbbbbbbb-0006-0006-0006-000000000006','aaaaaaaa-0004-0004-0004-000000000004','Maternity',   '2026-03-01','2026-05-31',90,'Maternity leave',         'APPROVED','2026-01-15 00:00:00+00'),
  ('bbbbbbbb-0009-0009-0009-000000000009','aaaaaaaa-0004-0004-0004-000000000004','Annual Leave','2026-02-25','2026-02-26',2,'Moving to new apartment', 'REJECTED','2026-02-08 00:00:00+00'),
  ('bbbbbbbb-0007-0007-0007-000000000007','aaaaaaaa-0004-0004-0004-000000000004','Remote Work', '2026-02-17','2026-02-21',5,'Remote work week',        'APPROVED','2026-02-10 00:00:00+00'),
  ('bbbbbbbb-0010-0010-0010-000000000010',NULL,                                  'Annual Leave','2026-03-10','2026-03-12',3,'Short break',             'PENDING', '2026-02-15 00:00:00+00'),
  ('bbbbbbbb-0001-0001-0001-000000000001','aaaaaaaa-0004-0004-0004-000000000004','Sick Leave',  '2026-01-20','2026-01-21',2,'Flu recovery',            'APPROVED','2026-01-19 00:00:00+00');

-- DOCUMENTS
INSERT INTO documents (employee_id,processed_by,title,doc_type,format,status,request_date,due_date) VALUES
  ('bbbbbbbb-0001-0001-0001-000000000001','aaaaaaaa-0001-0001-0001-000000000001','Employment Certificate',    'Certificate','PDF','completed',  '2026-02-01','2026-02-05'),
  ('bbbbbbbb-0003-0003-0003-000000000003','aaaaaaaa-0003-0003-0003-000000000003','Salary Certificate Jan 2026','Certificate','PDF','completed',  '2026-02-03','2026-02-07'),
  ('bbbbbbbb-0007-0007-0007-000000000007','aaaaaaaa-0007-0007-0007-000000000007','Work Experience Letter',    'Letter',     'PDF','processing', '2026-02-10','2026-02-17'),
  ('bbbbbbbb-0009-0009-0009-000000000009','aaaaaaaa-0009-0009-0009-000000000009','Tax Certificate 2025',      'Tax',        'PDF','pending',    '2026-02-12','2026-02-20'),
  ('bbbbbbbb-0002-0002-0002-000000000002','aaaaaaaa-0002-0002-0002-000000000002','Payslip January 2026',      'Payroll',    'PDF','completed',  '2026-02-01','2026-02-03'),
  ('bbbbbbbb-0010-0010-0010-000000000010','aaaaaaaa-0010-0010-0010-000000000010','HR Policy Document',        'Report',     'PDF','pending',    '2026-02-14','2026-02-21'),
  ('bbbbbbbb-0004-0004-0004-000000000004','aaaaaaaa-0004-0004-0004-000000000004','Employment Certificate',    'Certificate','PDF','rejected',   '2026-01-15','2026-01-20');

-- RECRUTEMENTS (Job Postings)
INSERT INTO recrutements (id,entreprise_id,department_id,created_by,title,position,description,requirements,location,employment_type,salary_min,salary_max,status,applicants_count,closing_date) VALUES
  ('eeeeeeee-0001-0001-0001-000000000001','11111111-0001-0001-0001-000000000001','22222222-0001-0001-0001-000000000001','aaaaaaaa-0004-0004-0004-000000000004','Senior React Developer',  'Senior React Developer',  'Build and maintain React applications',   '5+ years React, TypeScript, REST APIs', 'Casablanca, Morocco','Full-time',15000,22000,'open',  12,'2026-03-15'),
  ('eeeeeeee-0002-0002-0002-000000000002','11111111-0001-0001-0001-000000000001','22222222-0002-0002-0002-000000000002','aaaaaaaa-0004-0004-0004-000000000004','Marketing Specialist',    'Marketing Specialist',    'Digital marketing campaigns',             '3+ years digital marketing, SEO, SEM',  'Casablanca, Morocco','Full-time',10000,14000,'open',   8,'2026-03-01'),
  ('eeeeeeee-0003-0003-0003-000000000003','11111111-0001-0001-0001-000000000001','22222222-0003-0003-0003-000000000003','aaaaaaaa-0004-0004-0004-000000000004','HR Business Partner',     'HR Business Partner',     'Strategic HR management',                 '5+ years HR, HRIS experience',          'Casablanca, Morocco','Full-time',12000,16000,'open',   5,'2026-02-28'),
  ('eeeeeeee-0004-0004-0004-000000000004','11111111-0001-0001-0001-000000000001','22222222-0004-0004-0004-000000000004','aaaaaaaa-0004-0004-0004-000000000004','UX Designer',             'UX Designer',             'Design user experiences',                 '3+ years UX, Figma, user research',     'Casablanca, Morocco','Full-time',11000,15000,'closed', 24,'2026-01-31'),
  ('eeeeeeee-0005-0005-0005-000000000005','11111111-0001-0001-0001-000000000001','22222222-0006-0006-0006-000000000006','aaaaaaaa-0004-0004-0004-000000000004','QA Automation Engineer',  'QA Automation Engineer',  'Build automated test suites',             '3+ years QA, Selenium or Playwright',   'Casablanca, Morocco','Full-time',12000,17000,'open',   3,'2026-03-31');

-- CANDIDATES
INSERT INTO candidates (recrutement_id,name,email,phone,stage,status,notes,applied_date) VALUES
  ('eeeeeeee-0001-0001-0001-000000000001','Youssef Alami',   'youssef.a@email.com','+212 661 111 222','Technical Interview','in-progress','Strong portfolio',         '2026-02-01'),
  ('eeeeeeee-0001-0001-0001-000000000001','Nadia Benali',    'nadia.b@email.com',  '+212 662 222 333','Offer',              'offer',      'Excellent technical test', '2026-01-28'),
  ('eeeeeeee-0001-0001-0001-000000000001','Karim Idrissi',   'karim.i@email.com',  '+212 663 333 444','HR Screen',          'in-progress','Pending technical review', '2026-02-05'),
  ('eeeeeeee-0002-0002-0002-000000000002','Sara Ouali',      'sara.o@email.com',   '+212 664 444 555','Technical Interview','in-progress','Good campaign experience', '2026-02-03'),
  ('eeeeeeee-0002-0002-0002-000000000002','Mehdi Tazi',      'mehdi.t@email.com',  '+212 665 555 666','HR Screen',          'in-progress','Needs more B2B experience','2026-02-07'),
  ('eeeeeeee-0003-0003-0003-000000000003','Leila Cherkaoui', 'leila.c@email.com',  '+212 666 666 777','Offer',              'offer',      'Top candidate',            '2026-01-25'),
  ('eeeeeeee-0004-0004-0004-000000000004','Omar Fassi',      'omar.f@email.com',   '+212 667 777 888','Final Interview',    'hired',      'Hired - starts March 2026','2026-01-10'),
  ('eeeeeeee-0005-0005-0005-000000000005','Zineb Moussaoui', 'zineb.m@email.com',  '+212 668 888 999','Applied',            'in-progress','Application under review', '2026-02-14');

-- PERFORMANCES
INSERT INTO performances (employee_id,period,tasks_assigned,tasks_completed,score,notes) VALUES
  ('bbbbbbbb-0001-0001-0001-000000000001','Q4 2025',20,18,90,'Excellent delivery, strong leadership'),
  ('bbbbbbbb-0002-0002-0002-000000000002','Q4 2025',15,14,84,'Great campaign results, on-time delivery'),
  ('bbbbbbbb-0003-0003-0003-000000000003','Q4 2025',18,15,76,'Good analytical work, some delays'),
  ('bbbbbbbb-0004-0004-0004-000000000004','Q4 2025',12,12,94,'Exceptional HR management'),
  ('bbbbbbbb-0006-0006-0006-000000000006','Q4 2025',16,13,80,'Solid QA coverage, room for automation'),
  ('bbbbbbbb-0007-0007-0007-000000000007','Q4 2025',14,12,78,'Good backend work, needs better docs'),
  ('bbbbbbbb-0009-0009-0009-000000000009','Q4 2025',10, 9,82,'Creative designs, fast turnaround'),
  ('bbbbbbbb-0010-0010-0010-000000000010','Q4 2025',11,10,86,'Accurate financial analysis'),
  ('bbbbbbbb-0001-0001-0001-000000000001','Q1 2026', 8, 5,86,'On track for Q1 goals'),
  ('bbbbbbbb-0003-0003-0003-000000000003','Q1 2026', 6, 3,70,'In progress'),
  ('bbbbbbbb-0007-0007-0007-000000000007','Q1 2026', 5, 3,80,'Good pace on API work');

-- ANALYTIQUES
INSERT INTO analytiques (entreprise_id,report_type,period,period_start,period_end,data,generated_date) VALUES
  ('11111111-0001-0001-0001-000000000001','global',     'February 2026','2026-02-01','2026-02-28','{"total_employees":10,"active_employees":8,"total_projects":4,"tasks_completed":2,"tasks_in_progress":5,"avg_attendance_rate":87.5,"open_positions":4,"pending_leaves":3}','2026-02-01'),
  ('11111111-0001-0001-0001-000000000001','payroll',    'January 2026', '2026-01-01','2026-01-31','{"payroll_total":126500,"employees_paid":8}','2026-01-31'),
  ('11111111-0001-0001-0001-000000000001','global',     'January 2026', '2026-01-01','2026-01-31','{"total_employees":10,"avg_attendance_rate":91.0}','2026-01-31'),
  ('11111111-0001-0001-0001-000000000001','payroll',    'December 2025','2025-12-01','2025-12-31','{"payroll_total":121300,"employees_paid":8}','2025-12-31'),
  ('11111111-0001-0001-0001-000000000001','performance','Q4 2025',      '2025-10-01','2025-12-31','{"avg_score":83.6,"top_performer":"Ibrahim Rouass"}','2026-01-05'),
  ('11111111-0001-0001-0001-000000000001','recruitment','February 2026','2026-02-01','2026-02-28','{"open_positions":4,"total_candidates":8,"offers_made":2}','2026-02-15');

-- NOTIFICATIONS
INSERT INTO notifications (user_id,type,message,is_read,related_entity,related_id) VALUES
  ('aaaaaaaa-0003-0003-0003-000000000003','info',   'You have been assigned: Review Q4 Financial Report',  false,'task',        'dddddddd-0001-0001-0001-000000000001'),
  ('aaaaaaaa-0003-0003-0003-000000000003','info',   'You have been assigned: Code review PR #247',         false,'task',        'dddddddd-0005-0005-0005-000000000005'),
  ('aaaaaaaa-0001-0001-0001-000000000001','info',   'Deploy staging environment is ready for validation',  false,'task',        'dddddddd-0007-0007-0007-000000000007'),
  ('aaaaaaaa-0004-0004-0004-000000000004','info',   'Ibrahim Rouass submitted a leave request Feb 20-24',  false,'vacance',     NULL),
  ('aaaaaaaa-0004-0004-0004-000000000004','info',   'Ahmed Hassan submitted a leave request Mar 3-7',      false,'vacance',     NULL),
  ('aaaaaaaa-0002-0002-0002-000000000002','success','Design campaign landing page has been completed',     true, 'task',        'dddddddd-0010-0010-0010-000000000010'),
  ('aaaaaaaa-0001-0001-0001-000000000001','info',   'Diana Kim has registered and is pending approval',    true, 'user',        'aaaaaaaa-0008-0008-0008-000000000008'),
  ('aaaaaaaa-0003-0003-0003-000000000003','success','Your January 2026 payslip is now available',          true, 'payroll',     NULL),
  ('aaaaaaaa-0006-0006-0006-000000000006','success','Your maternity leave request has been approved',      true, 'vacance',     NULL),
  ('aaaaaaaa-0009-0009-0009-000000000009','warning','Your leave request for Feb 25-26 was not approved',   false,'vacance',     NULL),
  ('aaaaaaaa-0007-0007-0007-000000000007','success','Your remote work request for Feb 17-21 is approved',  true, 'vacance',     NULL),
  ('aaaaaaaa-0001-0001-0001-000000000001','info',   'Zineb Moussaoui applied for QA Automation Engineer',  false,'recrutement','eeeeeeee-0005-0005-0005-000000000005'),
  ('aaaaaaaa-0004-0004-0004-000000000004','info',   'Nadia Benali has reached the Offer stage',            false,'recrutement','eeeeeeee-0001-0001-0001-000000000001'),
  ('aaaaaaaa-0004-0004-0004-000000000004','success','February 2026 payroll has been generated',            false,'payroll',     NULL),
  ('aaaaaaaa-0002-0002-0002-000000000002','info',   'You have been assigned: Social media content plan',   true, 'task',        'dddddddd-0011-0011-0011-000000000011');

-- AI AGENTS
INSERT INTO ai_agents (id,entreprise_id,name,is_active,config) VALUES
  ('ffffffff-0001-0001-0001-000000000001','11111111-0001-0001-0001-000000000001','HR Assistant',         true,'{"model":"gpt-4","temperature":0.3,"max_tokens":1000}'),
  ('ffffffff-0002-0002-0002-000000000002','11111111-0001-0001-0001-000000000001','Performance Analyzer', true,'{"model":"gpt-4","temperature":0.2,"max_tokens":2000}'),
  ('ffffffff-0003-0003-0003-000000000003','11111111-0001-0001-0001-000000000001','Recruitment Screener', true,'{"model":"gpt-4","temperature":0.1,"max_tokens":1500}');

-- AI RECOMMENDATIONS
INSERT INTO ai_recommendations (agent_id,target_employee,type,reason,suggestion) VALUES
  ('ffffffff-0002-0002-0002-000000000002','bbbbbbbb-0003-0003-0003-000000000003','review',
   'Task completion rate is 83% — below the 90% target.',
   'Enroll Ahmed Hassan in advanced Python training to boost productivity.'),
  ('ffffffff-0002-0002-0002-000000000002','bbbbbbbb-0007-0007-0007-000000000007','review',
   'Code quality is high but documentation scores are consistently low.',
   'Pair Bob Tanaka with a senior developer for knowledge transfer sessions.'),
  ('ffffffff-0001-0001-0001-000000000001','bbbbbbbb-0009-0009-0009-000000000009','alert',
   'Carlos Ruiz has only used 4 of 22 annual leave days.',
   'Encourage planning remaining leave to avoid year-end accumulation.'),
  ('ffffffff-0003-0003-0003-000000000003',NULL,'optimization',
   'Nadia Benali scores highest among Senior React Developer applicants.',
   'Proceed to offer stage — strong technical test and portfolio review results.'),
  ('ffffffff-0002-0002-0002-000000000002','bbbbbbbb-0001-0001-0001-000000000001','bonus',
   'Ibrahim Rouass has maintained 90%+ task completion for 2 consecutive quarters.',
   'Consider for team lead promotion and performance bonus.');

-- SYSTEM LOGS
INSERT INTO system_logs (user_id,event,details,severity) VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001','user.login',              'Login via email',                       'info'),
  ('aaaaaaaa-0001-0001-0001-000000000001','project.create',          'Created project: BPMS Platform v2.0',   'info'),
  ('aaaaaaaa-0001-0001-0001-000000000001','task.create',             'Created task: Review Q4 Financial Report','info'),
  ('aaaaaaaa-0004-0004-0004-000000000004','payroll.generate',        'Generated payroll for January 2026 (8 employees)','info'),
  ('aaaaaaaa-0004-0004-0004-000000000004','vacance.approve',         'Approved sick leave for Sarah Martinez', 'info'),
  ('aaaaaaaa-0004-0004-0004-000000000004','vacance.reject',          'Rejected leave for Carlos Ruiz: overlap','warning'),
  ('aaaaaaaa-0002-0002-0002-000000000002','task.validate',           'Validated task: Design campaign landing page','info'),
  ('aaaaaaaa-0007-0007-0007-000000000007','task.complete',           'Completed task: Deploy staging environment','info'),
  ('aaaaaaaa-0001-0001-0001-000000000001','recrutement.create',      'Posted job: Senior React Developer',    'info'),
  ('aaaaaaaa-0003-0003-0003-000000000003','user.login',              'Login via email',                       'info');

-- Restore FK constraint (optional — remove this line if you want to keep seeding freely)
-- ALTER TABLE users ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
