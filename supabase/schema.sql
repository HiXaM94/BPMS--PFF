-- ============================================================
-- BPMS — Business Process Management System
-- Supabase PostgreSQL Schema
-- ============================================================
-- Covers all entities from the UML class diagram:
--   Entreprise, User, Employee, HR, TeamManager, Admin,
--   Recrutement, Payroll, Presence (Attendance), Vacance (Leave),
--   Document, Tasks, Performance, Analytiques, Notification, AiAgent
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'HR', 'TEAM_MANAGER', 'EMPLOYEE');

CREATE TYPE task_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

CREATE TYPE validation_status AS ENUM ('NONE', 'PENDING', 'VALIDATED', 'REJECTED');

CREATE TYPE leave_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TYPE payroll_status AS ENUM ('GENERATED', 'PAID');

CREATE TYPE enterprise_status AS ENUM ('active', 'trial', 'suspended');

CREATE TYPE enterprise_plan AS ENUM ('Starter', 'Business', 'Enterprise');

CREATE TYPE attendance_status AS ENUM ('present', 'late', 'absent', 'half-day', 'remote');

CREATE TYPE document_status AS ENUM ('pending', 'processing', 'completed', 'rejected');

CREATE TYPE document_type AS ENUM ('Certificate', 'Verification', 'Letter', 'Tax', 'Report', 'Payroll', 'Other');

CREATE TYPE recruitment_status AS ENUM ('open', 'closed', 'draft');

CREATE TYPE candidate_status AS ENUM ('in-progress', 'offer', 'hired', 'rejected');

CREATE TYPE candidate_stage AS ENUM (
  'Applied', 'HR Screen', 'Portfolio Review',
  'Technical Interview', 'Final Interview', 'Offer', 'Rejected'
);

CREATE TYPE employment_type AS ENUM ('Full-time', 'Part-time', 'Contract', 'Internship');

CREATE TYPE leave_type AS ENUM (
  'Annual Leave', 'Sick Leave', 'Maternity', 'Paternity',
  'Remote Work', 'Unpaid Leave', 'Other'
);

CREATE TYPE notification_type AS ENUM ('info', 'warning', 'success', 'error');

CREATE TYPE task_priority AS ENUM ('Low', 'Medium', 'High', 'Critical');

CREATE TYPE ai_recommendation_type AS ENUM ('warning', 'bonus', 'review', 'alert', 'optimization');

CREATE TYPE analytics_report_type AS ENUM (
  'performance', 'payroll', 'presence', 'recruitment', 'global'
);

CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending', 'suspended');

CREATE TYPE project_status AS ENUM ('Planned', 'In Progress', 'On Hold', 'Completed', 'Cancelled');

-- ============================================================
-- TABLE: entreprises
-- Corresponds to: Entreprise class
-- ============================================================
CREATE TABLE entreprises (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        SERIAL UNIQUE,
  name              TEXT NOT NULL,
  industry          TEXT,
  address           TEXT,
  phone             TEXT,
  email             TEXT,
  location          TEXT,
  status            enterprise_status NOT NULL DEFAULT 'active',
  plan              enterprise_plan NOT NULL DEFAULT 'Starter',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: departments
-- Supports: Entreprise.createDepartment()
-- ============================================================
CREATE TABLE departments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id     UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entreprise_id, name)
);

-- ============================================================
-- TABLE: users
-- Corresponds to: User class (base for all roles)
-- Auth is handled by Supabase Auth; this table extends it.
-- ============================================================
CREATE TABLE users (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- ============================================================
-- TABLE: employees
-- Corresponds to: Employee class
-- ============================================================
CREATE TABLE employees (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- ============================================================
-- TABLE: employee_skills
-- Supports: Employee profile skills section
-- ============================================================
CREATE TABLE employee_skills (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  level             SMALLINT CHECK (level BETWEEN 0 AND 100),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: employee_certifications
-- Supports: Employee profile certifications section
-- ============================================================
CREATE TABLE employee_certifications (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  issuer            TEXT,
  issued_date       DATE,
  expiry_date       DATE,
  status            TEXT DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: hr_profiles
-- Corresponds to: HR class
-- Extends employees for HR-specific capabilities
-- ============================================================
CREATE TABLE hr_profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id       UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: team_manager_profiles
-- Corresponds to: TeamManager class
-- ============================================================
CREATE TABLE team_manager_profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id       UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: admin_profiles
-- Corresponds to: Admin class
-- ============================================================
CREATE TABLE admin_profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: projects
-- Supports: TaskController, ProjectController
-- ============================================================
CREATE TABLE projects (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id     UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  department_id     UUID REFERENCES departments(id) ON DELETE SET NULL,
  manager_id        UUID REFERENCES employees(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  status            project_status NOT NULL DEFAULT 'Planned',
  progress          SMALLINT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  start_date        DATE,
  end_date          DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: tasks
-- Corresponds to: Tasks class
-- ============================================================
CREATE TABLE tasks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id        UUID REFERENCES projects(id) ON DELETE SET NULL,
  assignee_id       UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  priority          task_priority NOT NULL DEFAULT 'Medium',
  status            task_status NOT NULL DEFAULT 'NOT_STARTED',
  validation_status validation_status NOT NULL DEFAULT 'NONE',
  deadline          DATE,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  validated_at      TIMESTAMPTZ,
  validated_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: payrolls
-- Corresponds to: Payroll class
-- ============================================================
CREATE TABLE payrolls (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  generated_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  month             TEXT NOT NULL,
  period_start      DATE NOT NULL,
  period_end        DATE NOT NULL,
  base_salary       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  bonus             NUMERIC(12, 2) NOT NULL DEFAULT 0,
  deductions        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  net_salary        NUMERIC(12, 2) GENERATED ALWAYS AS (base_salary + bonus - deductions) STORED,
  status            payroll_status NOT NULL DEFAULT 'GENERATED',
  pay_date          DATE,
  payslip_url       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, period_start, period_end)
);

-- ============================================================
-- TABLE: presences (Attendance)
-- Corresponds to: Presence class
-- ============================================================
CREATE TABLE presences (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- ============================================================
-- TABLE: leave_balances
-- Supports: VacationRequest leave balance tracking
-- ============================================================
CREATE TABLE leave_balances (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- ============================================================
-- TABLE: vacances (Leave Requests)
-- Corresponds to: Vacance class
-- ============================================================
CREATE TABLE vacances (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  approved_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  leave_type        leave_type NOT NULL DEFAULT 'Annual Leave',
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  days_count        SMALLINT NOT NULL DEFAULT 1,
  reason            TEXT,
  status            leave_status NOT NULL DEFAULT 'PENDING',
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: documents
-- Corresponds to: Document class
-- ============================================================
CREATE TABLE documents (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  processed_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  doc_type          document_type NOT NULL DEFAULT 'Other',
  format            TEXT DEFAULT 'PDF',
  file_path         TEXT,
  status            document_status NOT NULL DEFAULT 'pending',
  request_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date          DATE,
  completed_date    DATE,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: recrutements (Job Postings)
-- Corresponds to: Recrutement class
-- ============================================================
CREATE TABLE recrutements (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id     UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  department_id     UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  position          TEXT NOT NULL,
  location          TEXT,
  employment_type   employment_type NOT NULL DEFAULT 'Full-time',
  salary_min        NUMERIC(12, 2),
  salary_max        NUMERIC(12, 2),
  salary_currency   TEXT DEFAULT 'MAD',
  description       TEXT,
  requirements      TEXT,
  status            recruitment_status NOT NULL DEFAULT 'draft',
  posted_date       DATE,
  closing_date      DATE,
  applicants_count  INTEGER NOT NULL DEFAULT 0,
  shortlisted_count INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: candidates
-- Supports: Recrutement candidate pipeline
-- ============================================================
CREATE TABLE candidates (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recrutement_id    UUID NOT NULL REFERENCES recrutements(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  stage             candidate_stage NOT NULL DEFAULT 'Applied',
  status            candidate_status NOT NULL DEFAULT 'in-progress',
  rating            NUMERIC(3, 1) CHECK (rating BETWEEN 0 AND 5),
  cv_url            TEXT,
  notes             TEXT,
  applied_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: performances
-- Corresponds to: Performance class
-- ============================================================
CREATE TABLE performances (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  evaluated_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  period            TEXT NOT NULL,
  period_start      DATE,
  period_end        DATE,
  tasks_assigned    INTEGER NOT NULL DEFAULT 0,
  tasks_completed   INTEGER NOT NULL DEFAULT 0,
  validated_tasks   INTEGER NOT NULL DEFAULT 0,
  score             NUMERIC(5, 2) CHECK (score BETWEEN 0 AND 100),
  completion_rate   NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE WHEN tasks_assigned = 0 THEN 0
         ELSE ROUND((tasks_completed::NUMERIC / tasks_assigned) * 100, 2)
    END
  ) STORED,
  notes             TEXT,
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: analytiques
-- Corresponds to: Analytiques class
-- ============================================================
CREATE TABLE analytiques (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
-- TABLE: notifications
-- Corresponds to: Notification class
-- ============================================================
CREATE TABLE notifications (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type              notification_type NOT NULL DEFAULT 'info',
  message           TEXT NOT NULL,
  is_read           BOOLEAN NOT NULL DEFAULT FALSE,
  related_entity    TEXT,
  related_id        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: ai_agents
-- Corresponds to: AiAgent class
-- ============================================================
CREATE TABLE ai_agents (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id     UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  name              TEXT NOT NULL DEFAULT 'BPMS AI Agent',
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  config            JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: ai_recommendations
-- Supports: AiAgent.analyzePerformance(), detectAbsencePattern(),
--           predictTurnover(), suggestTaskOptimization(), generateSmartAlert()
-- ============================================================
CREATE TABLE ai_recommendations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id          UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  target_employee   UUID REFERENCES employees(id) ON DELETE CASCADE,
  target_manager    UUID REFERENCES employees(id) ON DELETE CASCADE,
  type              ai_recommendation_type NOT NULL DEFAULT 'alert',
  reason            TEXT NOT NULL,
  suggestion        TEXT NOT NULL,
  action            TEXT,
  is_dismissed      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: system_logs
-- Supports: Admin dashboard system logs
-- ============================================================
CREATE TABLE system_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id     UUID REFERENCES entreprises(id) ON DELETE SET NULL,
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  event             TEXT NOT NULL,
  details           TEXT,
  severity          TEXT NOT NULL DEFAULT 'info',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES — for common query patterns
-- ============================================================

-- Users
CREATE INDEX idx_users_entreprise ON users(entreprise_id);
CREATE INDEX idx_users_role ON users(role);

-- Employees
CREATE INDEX idx_employees_user ON employees(user_id);
CREATE INDEX idx_employees_entreprise ON employees(entreprise_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);

-- Tasks
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_validation ON tasks(validation_status);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);

-- Projects
CREATE INDEX idx_projects_entreprise ON projects(entreprise_id);
CREATE INDEX idx_projects_manager ON projects(manager_id);

-- Payrolls
CREATE INDEX idx_payrolls_employee ON payrolls(employee_id);
CREATE INDEX idx_payrolls_status ON payrolls(status);
CREATE INDEX idx_payrolls_period ON payrolls(period_start, period_end);

-- Presences
CREATE INDEX idx_presences_employee ON presences(employee_id);
CREATE INDEX idx_presences_date ON presences(date);

-- Vacances
CREATE INDEX idx_vacances_employee ON vacances(employee_id);
CREATE INDEX idx_vacances_status ON vacances(status);
CREATE INDEX idx_vacances_dates ON vacances(start_date, end_date);

-- Documents
CREATE INDEX idx_documents_employee ON documents(employee_id);
CREATE INDEX idx_documents_status ON documents(status);

-- Recrutements
CREATE INDEX idx_recrutements_entreprise ON recrutements(entreprise_id);
CREATE INDEX idx_recrutements_status ON recrutements(status);

-- Candidates
CREATE INDEX idx_candidates_recrutement ON candidates(recrutement_id);
CREATE INDEX idx_candidates_status ON candidates(status);

-- Performances
CREATE INDEX idx_performances_employee ON performances(employee_id);
CREATE INDEX idx_performances_period ON performances(period_start, period_end);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);

-- AI Recommendations
CREATE INDEX idx_ai_recs_agent ON ai_recommendations(agent_id);
CREATE INDEX idx_ai_recs_employee ON ai_recommendations(target_employee);

-- System Logs
CREATE INDEX idx_system_logs_entreprise ON system_logs(entreprise_id);
CREATE INDEX idx_system_logs_created ON system_logs(created_at DESC);

-- ============================================================
-- FUNCTIONS & TRIGGERS — auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_entreprises_updated_at
  BEFORE UPDATE ON entreprises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_payrolls_updated_at
  BEFORE UPDATE ON payrolls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_presences_updated_at
  BEFORE UPDATE ON presences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_vacances_updated_at
  BEFORE UPDATE ON vacances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_recrutements_updated_at
  BEFORE UPDATE ON recrutements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_performances_updated_at
  BEFORE UPDATE ON performances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_ai_agents_updated_at
  BEFORE UPDATE ON ai_agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FUNCTION: auto-compute task completion timestamps
-- ============================================================

CREATE OR REPLACE FUNCTION handle_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'IN_PROGRESS' AND OLD.status = 'NOT_STARTED' THEN
    NEW.started_at = NOW();
  END IF;
  IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
    NEW.completed_at = NOW();
    NEW.validation_status = 'PENDING';
  END IF;
  IF NEW.validation_status = 'VALIDATED' AND OLD.validation_status != 'VALIDATED' THEN
    NEW.validated_at = NOW();
  END IF;
  IF NEW.validation_status = 'REJECTED' THEN
    NEW.status = 'IN_PROGRESS';
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_task_status
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION handle_task_status_change();

-- ============================================================
-- FUNCTION: auto-update leave balance when vacance is approved
-- ============================================================

CREATE OR REPLACE FUNCTION handle_vacance_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'APPROVED' AND OLD.status != 'APPROVED' THEN
    INSERT INTO leave_balances (employee_id, leave_type, year, total_days, used_days)
    VALUES (
      NEW.employee_id,
      NEW.leave_type,
      EXTRACT(YEAR FROM NEW.start_date)::SMALLINT,
      NEW.days_count,
      NEW.days_count
    )
    ON CONFLICT (employee_id, leave_type, year)
    DO UPDATE SET
      used_days = leave_balances.used_days + NEW.days_count,
      updated_at = NOW();
    NEW.reviewed_at = NOW();
  END IF;
  IF NEW.status = 'REJECTED' AND OLD.status != 'REJECTED' THEN
    NEW.reviewed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vacance_approval
  BEFORE UPDATE ON vacances
  FOR EACH ROW EXECUTE FUNCTION handle_vacance_approval();

-- ============================================================
-- FUNCTION: auto-update project progress from tasks
-- ============================================================

CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
  new_progress SMALLINT;
BEGIN
  IF NEW.project_id IS NOT NULL THEN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'COMPLETED')
    INTO total_tasks, completed_tasks
    FROM tasks
    WHERE project_id = NEW.project_id;

    IF total_tasks > 0 THEN
      new_progress := ROUND((completed_tasks::NUMERIC / total_tasks) * 100)::SMALLINT;
    ELSE
      new_progress := 0;
    END IF;

    UPDATE projects SET progress = new_progress, updated_at = NOW()
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_task_project_progress
  AFTER INSERT OR UPDATE OF status ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_project_progress();

-- ============================================================
-- FUNCTION: auto-create user profile on auth signup
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'EMPLOYEE')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
