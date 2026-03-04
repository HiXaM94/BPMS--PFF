-- Enable UUID extension (for older PostgreSQL versions)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Full schema for BPMS Platform
-- This file contains all table definitions, types, and constraints

-- ============================================================
-- ENUM TYPES
-- ============================================================

-- User roles
CREATE TYPE user_role AS ENUM ('ADMIN', 'TEAM_MANAGER', 'HR', 'EMPLOYEE');

-- User status
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending', 'suspended');

-- Enterprise status
CREATE TYPE enterprise_status AS ENUM ('active', 'inactive', 'trial', 'suspended');

-- Enterprise plan
CREATE TYPE enterprise_plan AS ENUM ('Starter', 'Business', 'Enterprise');

-- Attendance status
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'on_leave', 'holiday');

-- Document status
CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- Document type
CREATE TYPE document_type AS ENUM ('contract', 'id_card', 'diploma', 'certificate', 'other');

-- Recruitment status
CREATE TYPE recruitment_status AS ENUM ('draft', 'open', 'in_progress', 'closed', 'cancelled');

-- Candidate status
CREATE TYPE candidate_status AS ENUM ('new', 'screening', 'interview', 'offer', 'rejected', 'hired');

-- Candidate stage
CREATE TYPE candidate_stage AS ENUM ('HR Screen', 'Technical Interview', 'Final Interview', 'Offer');

-- Employment type
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract', 'internship');

-- Leave type
CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'maternity', 'paternity', 'unpaid', 'remote_work');

-- Leave status
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- Payroll status
CREATE TYPE payroll_status AS ENUM ('draft', 'pending', 'processed', 'paid', 'cancelled');

-- Task status
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'completed', 'cancelled');

-- Task priority
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Project status
CREATE TYPE project_status AS ENUM ('planning', 'in_progress', 'completed', 'on_hold', 'cancelled');

-- Validation status
CREATE TYPE validation_status AS ENUM ('pending', 'validated', 'rejected');

-- Notification type
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error', 'task', 'payroll', 'leave', 'recruitment');

-- AI recommendation type
CREATE TYPE ai_recommendation_type AS ENUM ('candidate', 'performance', 'training', 'leave', 'salary');

-- Analytics report type
CREATE TYPE analytics_report_type AS ENUM ('global', 'hr', 'payroll', 'attendance', 'performance');

-- ============================================================
-- TABLES
-- ============================================================

-- Entreprises table
CREATE TABLE entreprises (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  industry          TEXT,
  phone             TEXT,
  email             TEXT,
  location          TEXT,
  status            enterprise_status NOT NULL DEFAULT 'active',
  plan              enterprise_plan NOT NULL DEFAULT 'Starter',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Departments table
CREATE TABLE departments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id     UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table (references auth.users)
-- Note: FK constraint to auth.users will be added after seeding
CREATE TABLE users (
  id                UUID PRIMARY KEY,
  entreprise_id     UUID REFERENCES entreprises(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  email             TEXT NOT NULL UNIQUE,
  role              user_role NOT NULL DEFAULT 'EMPLOYEE',
  status            user_status NOT NULL DEFAULT 'active',
  avatar_initials   TEXT,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employees table
CREATE TABLE employees (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  entreprise_id     UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  department_id     UUID REFERENCES departments(id) ON DELETE SET NULL,
  manager_id        UUID REFERENCES employees(id) ON DELETE SET NULL,
  employee_code     TEXT UNIQUE,
  position          TEXT NOT NULL,
  hire_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  salary_base       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  phone             TEXT,
  location          TEXT,
  cnss              TEXT,
  rib               TEXT,
  bio               TEXT,
  status            user_status NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employee skills
CREATE TABLE employee_skills (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  level             SMALLINT CHECK (level BETWEEN 0 AND 100),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employee certifications
CREATE TABLE employee_certifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  issuer            TEXT,
  issued_date       DATE,
  expiry_date       DATE,
  status            TEXT DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Role profiles
CREATE TABLE admin_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE hr_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE team_manager_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id     UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  status            project_status NOT NULL DEFAULT 'planning',
  start_date        DATE,
  end_date          DATE,
  budget            NUMERIC(12, 2),
  created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID REFERENCES projects(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  status            task_status NOT NULL DEFAULT 'todo',
  priority          task_priority NOT NULL DEFAULT 'medium',
  assigned_to       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date          TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  validated_at      TIMESTAMPTZ,
  validated_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recruitment tables
CREATE TABLE recrutements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id     UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  requirements      TEXT,
  department_id     UUID REFERENCES departments(id) ON DELETE SET NULL,
  employment_type   employment_type NOT NULL DEFAULT 'full_time',
  location          TEXT,
  salary_min        NUMERIC(12, 2),
  salary_max        NUMERIC(12, 2),
  status            recruitment_status NOT NULL DEFAULT 'draft',
  created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  published_at      TIMESTAMPTZ,
  closed_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE candidates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recrutement_id    UUID NOT NULL REFERENCES recrutements(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  cv_url            TEXT,
  linkedin_url      TEXT,
  experience_years  SMALLINT,
  skills            TEXT,
  status            candidate_status NOT NULL DEFAULT 'new',
  stage             candidate_stage NOT NULL DEFAULT 'HR Screen',
  rating            SMALLINT CHECK (rating BETWEEN 0 AND 5),
  notes             TEXT,
  applied_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leave management
CREATE TABLE leave_balances (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type        leave_type NOT NULL,
  year              SMALLINT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  total_days        SMALLINT NOT NULL DEFAULT 0,
  used_days         SMALLINT NOT NULL DEFAULT 0,
  remaining_days    SMALLINT GENERATED ALWAYS AS (total_days - used_days) STORED,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, leave_type, year)
);

CREATE TABLE vacances (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type        leave_type NOT NULL,
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  days_count        SMALLINT NOT NULL,
  reason            TEXT,
  status            leave_status NOT NULL DEFAULT 'pending',
  approved_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attendance
CREATE TABLE presences (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date              DATE NOT NULL,
  check_in_time     TIME,
  check_out_time    TIME,
  hours_worked      NUMERIC(5, 2),
  overtime_hours    NUMERIC(5, 2) DEFAULT 0,
  status            attendance_status NOT NULL DEFAULT 'present',
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, date)
);

-- Payroll
CREATE TABLE payrolls (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period_start      DATE NOT NULL,
  period_end        DATE NOT NULL,
  salary_base       NUMERIC(12, 2) NOT NULL,
  overtime_hours    NUMERIC(5, 2) DEFAULT 0,
  overtime_pay      NUMERIC(12, 2) DEFAULT 0,
  bonuses           NUMERIC(12, 2) DEFAULT 0,
  deductions        NUMERIC(12, 2) DEFAULT 0,
  net_salary        NUMERIC(12, 2) NOT NULL,
  status            payroll_status NOT NULL DEFAULT 'draft',
  processed_at      TIMESTAMPTZ,
  paid_at           TIMESTAMPTZ,
  created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, period_start, period_end)
);

-- Documents
CREATE TABLE documents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID REFERENCES employees(id) ON DELETE CASCADE,
  entreprise_id     UUID REFERENCES entreprises(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  type              document_type NOT NULL,
  file_url          TEXT,
  status            document_status NOT NULL DEFAULT 'pending',
  uploaded_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type              notification_type NOT NULL DEFAULT 'info',
  message           TEXT NOT NULL,
  is_read           BOOLEAN NOT NULL DEFAULT FALSE,
  related_entity    TEXT,
  related_id        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI recommendations
CREATE TABLE ai_recommendations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  employee_id       UUID REFERENCES employees(id) ON DELETE SET NULL,
  type              ai_recommendation_type NOT NULL,
  title             TEXT NOT NULL,
  content           TEXT NOT NULL,
  confidence        NUMERIC(3, 2) CHECK (confidence BETWEEN 0 AND 1),
  applied           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytics
CREATE TABLE analytiques (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id     UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  generated_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  report_type       analytics_report_type NOT NULL DEFAULT 'global',
  period            TEXT NOT NULL,
  period_start      DATE,
  period_end        DATE,
  data              JSONB,
  generated_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_entreprise ON users(entreprise_id);

-- Employees
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_entreprise ON employees(entreprise_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_status ON employees(status);

-- Projects
CREATE INDEX idx_projects_entreprise ON projects(entreprise_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_by ON projects(created_by);

-- Tasks
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- Recruitment
CREATE INDEX idx_recrutements_entreprise ON recrutements(entreprise_id);
CREATE INDEX idx_recrutements_status ON recrutements(status);
CREATE INDEX idx_recrutements_department ON recrutements(department_id);

CREATE INDEX idx_candidates_recrutement ON candidates(recrutement_id);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_stage ON candidates(stage);

-- Leave
CREATE INDEX idx_leave_balances_employee ON leave_balances(employee_id);
CREATE INDEX idx_vacances_employee ON vacances(employee_id);
CREATE INDEX idx_vacances_status ON vacances(status);

-- Attendance
CREATE INDEX idx_presences_employee ON presences(employee_id);
CREATE INDEX idx_presences_date ON presences(date);

-- Payroll
CREATE INDEX idx_payrolls_employee ON payrolls(employee_id);
CREATE INDEX idx_payrolls_status ON payrolls(status);
CREATE INDEX idx_payrolls_period ON payrolls(period_start, period_end);

-- Documents
CREATE INDEX idx_documents_employee ON documents(employee_id);
CREATE INDEX idx_documents_entreprise ON documents(entreprise_id);
CREATE INDEX idx_documents_status ON documents(status);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_recrutements_updated_at
  BEFORE UPDATE ON recrutements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_leave_balances_updated_at
  BEFORE UPDATE ON leave_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_vacances_updated_at
  BEFORE UPDATE ON vacances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_presences_updated_at
  BEFORE UPDATE ON presences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_payrolls_updated_at
  BEFORE UPDATE ON payrolls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();