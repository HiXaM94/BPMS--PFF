-- ============================================================
-- BPMS — Row Level Security (RLS) Policies
-- Supabase PostgreSQL
-- ============================================================
-- Role hierarchy:
--   ADMIN       → full access across all entreprises
--   HR          → full access within their entreprise
--   TEAM_MANAGER→ access to their team's data
--   EMPLOYEE    → access to their own data only
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get the current user's role from the users table
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Get the current user's entreprise_id
CREATE OR REPLACE FUNCTION auth_user_entreprise()
RETURNS UUID AS $$
  SELECT entreprise_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Get the current user's employee record id
CREATE OR REPLACE FUNCTION auth_employee_id()
RETURNS UUID AS $$
  SELECT id FROM employees WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user is ADMIN
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT auth_user_role() = 'ADMIN';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user is HR
CREATE OR REPLACE FUNCTION is_hr()
RETURNS BOOLEAN AS $$
  SELECT auth_user_role() = 'HR';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user is TEAM_MANAGER
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
  SELECT auth_user_role() = 'TEAM_MANAGER';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user is ADMIN or HR
CREATE OR REPLACE FUNCTION is_admin_or_hr()
RETURNS BOOLEAN AS $$
  SELECT auth_user_role() IN ('ADMIN', 'HR');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user is ADMIN, HR, or TEAM_MANAGER
CREATE OR REPLACE FUNCTION is_admin_hr_or_manager()
RETURNS BOOLEAN AS $$
  SELECT auth_user_role() IN ('ADMIN', 'HR', 'TEAM_MANAGER');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if an employee belongs to the current manager's team
CREATE OR REPLACE FUNCTION is_my_team_member(emp_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees
    WHERE id = emp_id
      AND manager_id = auth_employee_id()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if an employee belongs to the same entreprise
CREATE OR REPLACE FUNCTION same_entreprise_employee(emp_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = emp_id
      AND e.entreprise_id = auth_user_entreprise()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE entreprises              ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees                ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_skills          ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_certifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_manager_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payrolls                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE presences                ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances           ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacances                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents                ENABLE ROW LEVEL SECURITY;
ALTER TABLE recrutements             ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates               ENABLE ROW LEVEL SECURITY;
ALTER TABLE performances             ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytiques              ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents                ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs              ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: entreprises
-- ADMIN: full CRUD
-- Others: read their own entreprise only
-- ============================================================

CREATE POLICY "entreprises_admin_all"
  ON entreprises FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "entreprises_member_select"
  ON entreprises FOR SELECT
  USING (id = auth_user_entreprise());

-- ============================================================
-- TABLE: departments
-- ADMIN/HR: full CRUD within entreprise
-- Others: read only within entreprise
-- ============================================================

CREATE POLICY "departments_admin_hr_all"
  ON departments FOR ALL
  USING (is_admin_or_hr() AND entreprise_id = auth_user_entreprise())
  WITH CHECK (is_admin_or_hr() AND entreprise_id = auth_user_entreprise());

CREATE POLICY "departments_member_select"
  ON departments FOR SELECT
  USING (entreprise_id = auth_user_entreprise());

-- ============================================================
-- TABLE: users
-- ADMIN: full CRUD
-- HR: read/update within same entreprise
-- Self: read and update own record
-- ============================================================

CREATE POLICY "users_admin_all"
  ON users FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "users_hr_select"
  ON users FOR SELECT
  USING (is_hr() AND entreprise_id = auth_user_entreprise());

CREATE POLICY "users_hr_update"
  ON users FOR UPDATE
  USING (is_hr() AND entreprise_id = auth_user_entreprise())
  WITH CHECK (is_hr() AND entreprise_id = auth_user_entreprise());

CREATE POLICY "users_self_select"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users_self_update"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- TABLE: employees
-- ADMIN/HR: full CRUD within entreprise
-- MANAGER: read their team members
-- EMPLOYEE: read own record
-- ============================================================

CREATE POLICY "employees_admin_hr_all"
  ON employees FOR ALL
  USING (is_admin_or_hr() AND entreprise_id = auth_user_entreprise())
  WITH CHECK (is_admin_or_hr() AND entreprise_id = auth_user_entreprise());

CREATE POLICY "employees_manager_select_team"
  ON employees FOR SELECT
  USING (is_manager() AND (manager_id = auth_employee_id() OR id = auth_employee_id()));

CREATE POLICY "employees_self_select"
  ON employees FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "employees_self_update"
  ON employees FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- TABLE: employee_skills
-- ADMIN/HR: full CRUD
-- EMPLOYEE: manage own skills
-- MANAGER: read team skills
-- ============================================================

CREATE POLICY "skills_admin_hr_all"
  ON employee_skills FOR ALL
  USING (is_admin_or_hr() AND same_entreprise_employee(employee_id))
  WITH CHECK (is_admin_or_hr() AND same_entreprise_employee(employee_id));

CREATE POLICY "skills_self_all"
  ON employee_skills FOR ALL
  USING (employee_id = auth_employee_id())
  WITH CHECK (employee_id = auth_employee_id());

CREATE POLICY "skills_manager_select"
  ON employee_skills FOR SELECT
  USING (is_manager() AND is_my_team_member(employee_id));

-- ============================================================
-- TABLE: employee_certifications
-- Same pattern as skills
-- ============================================================

CREATE POLICY "certs_admin_hr_all"
  ON employee_certifications FOR ALL
  USING (is_admin_or_hr() AND same_entreprise_employee(employee_id))
  WITH CHECK (is_admin_or_hr() AND same_entreprise_employee(employee_id));

CREATE POLICY "certs_self_all"
  ON employee_certifications FOR ALL
  USING (employee_id = auth_employee_id())
  WITH CHECK (employee_id = auth_employee_id());

CREATE POLICY "certs_manager_select"
  ON employee_certifications FOR SELECT
  USING (is_manager() AND is_my_team_member(employee_id));

-- ============================================================
-- TABLE: hr_profiles / team_manager_profiles / admin_profiles
-- ADMIN: full CRUD
-- Self: read own profile
-- ============================================================

CREATE POLICY "hr_profiles_admin_all"
  ON hr_profiles FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "hr_profiles_self_select"
  ON hr_profiles FOR SELECT
  USING (employee_id = auth_employee_id());

CREATE POLICY "manager_profiles_admin_all"
  ON team_manager_profiles FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "manager_profiles_self_select"
  ON team_manager_profiles FOR SELECT
  USING (employee_id = auth_employee_id());

CREATE POLICY "admin_profiles_admin_all"
  ON admin_profiles FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "admin_profiles_self_select"
  ON admin_profiles FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- TABLE: projects
-- ADMIN/HR: full CRUD within entreprise
-- MANAGER: CRUD for own projects, read others in entreprise
-- EMPLOYEE: read projects they have tasks in
-- ============================================================

CREATE POLICY "projects_admin_hr_all"
  ON projects FOR ALL
  USING (is_admin_or_hr() AND entreprise_id = auth_user_entreprise())
  WITH CHECK (is_admin_or_hr() AND entreprise_id = auth_user_entreprise());

CREATE POLICY "projects_manager_all"
  ON projects FOR ALL
  USING (is_manager() AND manager_id = auth_employee_id())
  WITH CHECK (is_manager() AND manager_id = auth_employee_id());

CREATE POLICY "projects_manager_select_entreprise"
  ON projects FOR SELECT
  USING (is_manager() AND entreprise_id = auth_user_entreprise());

CREATE POLICY "projects_employee_select"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.project_id = projects.id
        AND tasks.assignee_id = auth_employee_id()
    )
  );

-- ============================================================
-- TABLE: tasks
-- ADMIN/HR: full CRUD within entreprise
-- MANAGER: CRUD for tasks in their projects
-- EMPLOYEE: read/update own tasks
-- ============================================================

CREATE POLICY "tasks_admin_hr_all"
  ON tasks FOR ALL
  USING (
    is_admin_or_hr() AND (
      project_id IS NULL OR
      EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND p.entreprise_id = auth_user_entreprise())
    )
  )
  WITH CHECK (
    is_admin_or_hr() AND (
      project_id IS NULL OR
      EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND p.entreprise_id = auth_user_entreprise())
    )
  );

CREATE POLICY "tasks_manager_all"
  ON tasks FOR ALL
  USING (
    is_manager() AND (
      EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND p.manager_id = auth_employee_id())
      OR is_my_team_member(assignee_id)
    )
  )
  WITH CHECK (
    is_manager() AND (
      EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND p.manager_id = auth_employee_id())
      OR is_my_team_member(assignee_id)
    )
  );

CREATE POLICY "tasks_employee_select"
  ON tasks FOR SELECT
  USING (assignee_id = auth_employee_id());

CREATE POLICY "tasks_employee_update_status"
  ON tasks FOR UPDATE
  USING (assignee_id = auth_employee_id())
  WITH CHECK (assignee_id = auth_employee_id());

-- ============================================================
-- TABLE: payrolls
-- ADMIN/HR: full CRUD within entreprise
-- MANAGER: read their team's payrolls
-- EMPLOYEE: read own payroll
-- ============================================================

CREATE POLICY "payrolls_admin_hr_all"
  ON payrolls FOR ALL
  USING (is_admin_or_hr() AND same_entreprise_employee(employee_id))
  WITH CHECK (is_admin_or_hr() AND same_entreprise_employee(employee_id));

CREATE POLICY "payrolls_manager_select"
  ON payrolls FOR SELECT
  USING (is_manager() AND is_my_team_member(employee_id));

CREATE POLICY "payrolls_self_select"
  ON payrolls FOR SELECT
  USING (employee_id = auth_employee_id());

-- ============================================================
-- TABLE: presences (Attendance)
-- ADMIN/HR: full CRUD within entreprise
-- MANAGER: read/insert for their team
-- EMPLOYEE: read/insert own attendance
-- ============================================================

CREATE POLICY "presences_admin_hr_all"
  ON presences FOR ALL
  USING (is_admin_or_hr() AND same_entreprise_employee(employee_id))
  WITH CHECK (is_admin_or_hr() AND same_entreprise_employee(employee_id));

CREATE POLICY "presences_manager_select"
  ON presences FOR SELECT
  USING (is_manager() AND is_my_team_member(employee_id));

CREATE POLICY "presences_self_all"
  ON presences FOR ALL
  USING (employee_id = auth_employee_id())
  WITH CHECK (employee_id = auth_employee_id());

-- ============================================================
-- TABLE: leave_balances
-- ADMIN/HR: full CRUD
-- MANAGER: read team balances
-- EMPLOYEE: read own balance
-- ============================================================

CREATE POLICY "leave_balances_admin_hr_all"
  ON leave_balances FOR ALL
  USING (is_admin_or_hr() AND same_entreprise_employee(employee_id))
  WITH CHECK (is_admin_or_hr() AND same_entreprise_employee(employee_id));

CREATE POLICY "leave_balances_manager_select"
  ON leave_balances FOR SELECT
  USING (is_manager() AND is_my_team_member(employee_id));

CREATE POLICY "leave_balances_self_select"
  ON leave_balances FOR SELECT
  USING (employee_id = auth_employee_id());

-- ============================================================
-- TABLE: vacances (Leave Requests)
-- ADMIN/HR: full CRUD within entreprise
-- MANAGER: read and approve/reject their team's requests
-- EMPLOYEE: CRUD own requests (cannot approve)
-- ============================================================

CREATE POLICY "vacances_admin_hr_all"
  ON vacances FOR ALL
  USING (is_admin_or_hr() AND same_entreprise_employee(employee_id))
  WITH CHECK (is_admin_or_hr() AND same_entreprise_employee(employee_id));

CREATE POLICY "vacances_manager_select"
  ON vacances FOR SELECT
  USING (is_manager() AND is_my_team_member(employee_id));

CREATE POLICY "vacances_manager_update"
  ON vacances FOR UPDATE
  USING (is_manager() AND is_my_team_member(employee_id))
  WITH CHECK (is_manager() AND is_my_team_member(employee_id));

CREATE POLICY "vacances_self_all"
  ON vacances FOR ALL
  USING (employee_id = auth_employee_id())
  WITH CHECK (employee_id = auth_employee_id());

-- ============================================================
-- TABLE: documents
-- ADMIN/HR: full CRUD within entreprise
-- MANAGER: read their team's documents
-- EMPLOYEE: read/insert own documents
-- ============================================================

CREATE POLICY "documents_admin_hr_all"
  ON documents FOR ALL
  USING (is_admin_or_hr() AND same_entreprise_employee(employee_id))
  WITH CHECK (is_admin_or_hr() AND same_entreprise_employee(employee_id));

CREATE POLICY "documents_manager_select"
  ON documents FOR SELECT
  USING (is_manager() AND is_my_team_member(employee_id));

CREATE POLICY "documents_self_select"
  ON documents FOR SELECT
  USING (employee_id = auth_employee_id());

CREATE POLICY "documents_self_insert"
  ON documents FOR INSERT
  WITH CHECK (employee_id = auth_employee_id());

-- ============================================================
-- TABLE: recrutements (Job Postings)
-- ADMIN/HR: full CRUD within entreprise
-- MANAGER: read within entreprise
-- EMPLOYEE: read open postings within entreprise
-- ============================================================

CREATE POLICY "recrutements_admin_hr_all"
  ON recrutements FOR ALL
  USING (is_admin_or_hr() AND entreprise_id = auth_user_entreprise())
  WITH CHECK (is_admin_or_hr() AND entreprise_id = auth_user_entreprise());

CREATE POLICY "recrutements_manager_select"
  ON recrutements FOR SELECT
  USING (is_manager() AND entreprise_id = auth_user_entreprise());

CREATE POLICY "recrutements_employee_select_open"
  ON recrutements FOR SELECT
  USING (entreprise_id = auth_user_entreprise() AND status = 'open');

-- ============================================================
-- TABLE: candidates
-- ADMIN/HR: full CRUD
-- MANAGER: read candidates for their entreprise
-- ============================================================

CREATE POLICY "candidates_admin_hr_all"
  ON candidates FOR ALL
  USING (
    is_admin_or_hr() AND EXISTS (
      SELECT 1 FROM recrutements r
      WHERE r.id = candidates.recrutement_id
        AND r.entreprise_id = auth_user_entreprise()
    )
  )
  WITH CHECK (
    is_admin_or_hr() AND EXISTS (
      SELECT 1 FROM recrutements r
      WHERE r.id = candidates.recrutement_id
        AND r.entreprise_id = auth_user_entreprise()
    )
  );

CREATE POLICY "candidates_manager_select"
  ON candidates FOR SELECT
  USING (
    is_manager() AND EXISTS (
      SELECT 1 FROM recrutements r
      WHERE r.id = candidates.recrutement_id
        AND r.entreprise_id = auth_user_entreprise()
    )
  );

-- ============================================================
-- TABLE: performances
-- ADMIN/HR: full CRUD within entreprise
-- MANAGER: read/create for their team
-- EMPLOYEE: read own performance
-- ============================================================

CREATE POLICY "performances_admin_hr_all"
  ON performances FOR ALL
  USING (is_admin_or_hr() AND same_entreprise_employee(employee_id))
  WITH CHECK (is_admin_or_hr() AND same_entreprise_employee(employee_id));

CREATE POLICY "performances_manager_all"
  ON performances FOR ALL
  USING (is_manager() AND is_my_team_member(employee_id))
  WITH CHECK (is_manager() AND is_my_team_member(employee_id));

CREATE POLICY "performances_self_select"
  ON performances FOR SELECT
  USING (employee_id = auth_employee_id());

-- ============================================================
-- TABLE: analytiques
-- ADMIN: full CRUD
-- HR/MANAGER: read within entreprise
-- ============================================================

CREATE POLICY "analytiques_admin_all"
  ON analytiques FOR ALL
  USING (is_admin() AND entreprise_id = auth_user_entreprise())
  WITH CHECK (is_admin() AND entreprise_id = auth_user_entreprise());

CREATE POLICY "analytiques_hr_all"
  ON analytiques FOR ALL
  USING (is_hr() AND entreprise_id = auth_user_entreprise())
  WITH CHECK (is_hr() AND entreprise_id = auth_user_entreprise());

CREATE POLICY "analytiques_manager_select"
  ON analytiques FOR SELECT
  USING (is_manager() AND entreprise_id = auth_user_entreprise());

-- ============================================================
-- TABLE: notifications
-- Users can only see and manage their own notifications
-- ============================================================

CREATE POLICY "notifications_self_all"
  ON notifications FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_admin_hr_insert"
  ON notifications FOR INSERT
  WITH CHECK (is_admin_or_hr());

-- ============================================================
-- TABLE: ai_agents
-- ADMIN: full CRUD
-- Others: read within entreprise
-- ============================================================

CREATE POLICY "ai_agents_admin_all"
  ON ai_agents FOR ALL
  USING (is_admin() AND entreprise_id = auth_user_entreprise())
  WITH CHECK (is_admin() AND entreprise_id = auth_user_entreprise());

CREATE POLICY "ai_agents_member_select"
  ON ai_agents FOR SELECT
  USING (entreprise_id = auth_user_entreprise());

-- ============================================================
-- TABLE: ai_recommendations
-- ADMIN/HR/MANAGER: read recommendations for their scope
-- ============================================================

CREATE POLICY "ai_recs_admin_hr_all"
  ON ai_recommendations FOR ALL
  USING (
    is_admin_or_hr() AND EXISTS (
      SELECT 1 FROM ai_agents a
      WHERE a.id = ai_recommendations.agent_id
        AND a.entreprise_id = auth_user_entreprise()
    )
  )
  WITH CHECK (
    is_admin_or_hr() AND EXISTS (
      SELECT 1 FROM ai_agents a
      WHERE a.id = ai_recommendations.agent_id
        AND a.entreprise_id = auth_user_entreprise()
    )
  );

CREATE POLICY "ai_recs_manager_select"
  ON ai_recommendations FOR SELECT
  USING (
    is_manager() AND (
      target_manager = auth_employee_id()
      OR is_my_team_member(target_employee)
    )
  );

-- ============================================================
-- TABLE: system_logs
-- ADMIN: full access
-- HR/MANAGER: read within entreprise
-- ============================================================

CREATE POLICY "system_logs_admin_all"
  ON system_logs FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "system_logs_hr_select"
  ON system_logs FOR SELECT
  USING (is_hr() AND entreprise_id = auth_user_entreprise());

CREATE POLICY "system_logs_manager_select"
  ON system_logs FOR SELECT
  USING (is_manager() AND entreprise_id = auth_user_entreprise());
