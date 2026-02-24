-- Add audit logs, settings, and enhanced features for production BPMS

-- ============================================================
-- AUDIT LOGS TABLE
-- Track all critical actions for compliance and security
-- ============================================================
CREATE TABLE audit_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  entreprise_id     UUID REFERENCES entreprises(id) ON DELETE CASCADE,
  action            TEXT NOT NULL,
  entity_type       TEXT NOT NULL, -- 'user', 'employee', 'document', 'role', etc.
  entity_id         UUID,
  old_values        JSONB,
  new_values        JSONB,
  ip_address        INET,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entreprise ON audit_logs(entreprise_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================
-- SYSTEM SETTINGS TABLE
-- Global and per-entreprise configuration
-- ============================================================
CREATE TABLE system_settings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id     UUID REFERENCES entreprises(id) ON DELETE CASCADE,
  category          TEXT NOT NULL, -- 'general', 'security', 'notifications', 'ai', 'integrations'
  key               TEXT NOT NULL,
  value             JSONB NOT NULL,
  is_encrypted      BOOLEAN DEFAULT FALSE,
  updated_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entreprise_id, category, key)
);

CREATE INDEX idx_settings_entreprise ON system_settings(entreprise_id);
CREATE INDEX idx_settings_category ON system_settings(category);

-- ============================================================
-- USER PREFERENCES TABLE
-- Individual user preferences and customization
-- ============================================================
CREATE TABLE user_preferences (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme             TEXT DEFAULT 'light', -- 'light', 'dark', 'auto'
  language          TEXT DEFAULT 'en',
  timezone          TEXT DEFAULT 'UTC',
  notifications     JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
  dashboard_layout  JSONB,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROLE CHANGE REQUESTS TABLE
-- Track role switching with approval workflow
-- ============================================================
CREATE TABLE role_change_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_role         user_role NOT NULL,
  to_role           user_role NOT NULL,
  reason            TEXT,
  status            TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_role_requests_user ON role_change_requests(user_id);
CREATE INDEX idx_role_requests_status ON role_change_requests(status);

-- ============================================================
-- FILE UPLOADS TABLE
-- Track document and image uploads
-- ============================================================
CREATE TABLE file_uploads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  entreprise_id     UUID REFERENCES entreprises(id) ON DELETE CASCADE,
  file_name         TEXT NOT NULL,
  file_type         TEXT NOT NULL,
  file_size         BIGINT NOT NULL,
  storage_path      TEXT NOT NULL,
  entity_type       TEXT, -- 'profile_image', 'document', 'attachment'
  entity_id         UUID,
  metadata          JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_uploads_user ON file_uploads(uploaded_by);
CREATE INDEX idx_uploads_entity ON file_uploads(entity_type, entity_id);

-- ============================================================
-- AI INTERACTIONS TABLE
-- Track AI assistant usage and responses
-- ============================================================
CREATE TABLE ai_interactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  entreprise_id     UUID REFERENCES entreprises(id) ON DELETE CASCADE,
  interaction_type  TEXT NOT NULL, -- 'chat', 'recommendation', 'analysis', 'document_processing'
  prompt            TEXT NOT NULL,
  response          TEXT,
  model_used        TEXT,
  tokens_used       INTEGER,
  confidence_score  NUMERIC(3, 2),
  feedback_rating   INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
  metadata          JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_interactions_user ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_type ON ai_interactions(interaction_type);
CREATE INDEX idx_ai_interactions_created ON ai_interactions(created_at DESC);

-- ============================================================
-- CACHE METADATA TABLE
-- Track Redis cache entries for management
-- ============================================================
CREATE TABLE cache_metadata (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key         TEXT UNIQUE NOT NULL,
  entity_type       TEXT NOT NULL,
  entity_id         UUID,
  ttl_seconds       INTEGER,
  last_accessed     TIMESTAMPTZ,
  access_count      INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ
);

CREATE INDEX idx_cache_key ON cache_metadata(cache_key);
CREATE INDEX idx_cache_expires ON cache_metadata(expires_at);

-- ============================================================
-- PERMISSIONS TABLE
-- Granular permission management
-- ============================================================
CREATE TABLE permissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT UNIQUE NOT NULL,
  description       TEXT,
  category          TEXT NOT NULL, -- 'users', 'documents', 'reports', 'settings', etc.
  resource          TEXT NOT NULL,
  action            TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'approve'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROLE PERMISSIONS TABLE
-- Map permissions to roles
-- ============================================================
CREATE TABLE role_permissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role              user_role NOT NULL,
  permission_id     UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  entreprise_id     UUID REFERENCES entreprises(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role, permission_id, entreprise_id)
);

CREATE INDEX idx_role_perms_role ON role_permissions(role);
CREATE INDEX idx_role_perms_permission ON role_permissions(permission_id);

-- ============================================================
-- ENABLE RLS ON NEW TABLES
-- ============================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================

-- Audit Logs: Admin full access, users can read their own
CREATE POLICY "audit_logs_admin_all"
  ON audit_logs FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "audit_logs_user_select"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());

-- System Settings: Admin full access, others read within entreprise
CREATE POLICY "settings_admin_all"
  ON system_settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "settings_hr_select"
  ON system_settings FOR SELECT
  USING (is_hr() AND entreprise_id = auth_user_entreprise());

-- User Preferences: Users manage their own
CREATE POLICY "preferences_self_all"
  ON user_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Role Change Requests: Users can create/view own, admin/hr can manage
CREATE POLICY "role_requests_self_insert"
  ON role_change_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "role_requests_self_select"
  ON role_change_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "role_requests_admin_all"
  ON role_change_requests FOR ALL
  USING (is_admin_or_hr())
  WITH CHECK (is_admin_or_hr());

-- File Uploads: Users can upload, view own and entreprise files
CREATE POLICY "uploads_self_insert"
  ON file_uploads FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "uploads_entreprise_select"
  ON file_uploads FOR SELECT
  USING (entreprise_id = auth_user_entreprise() OR uploaded_by = auth.uid());

CREATE POLICY "uploads_admin_all"
  ON file_uploads FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- AI Interactions: Users view own, admin/hr view all in entreprise
CREATE POLICY "ai_self_all"
  ON ai_interactions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_admin_select"
  ON ai_interactions FOR SELECT
  USING (is_admin_or_hr() AND entreprise_id = auth_user_entreprise());

-- Permissions: Admin full access, others read
CREATE POLICY "permissions_admin_all"
  ON permissions FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "permissions_all_select"
  ON permissions FOR SELECT
  USING (true);

-- Role Permissions: Admin full access, others read
CREATE POLICY "role_perms_admin_all"
  ON role_permissions FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "role_perms_all_select"
  ON role_permissions FOR SELECT
  USING (true);

-- ============================================================
-- SEED DEFAULT PERMISSIONS
-- ============================================================
INSERT INTO permissions (name, description, category, resource, action) VALUES
  -- User Management
  ('users.create', 'Create new users', 'users', 'users', 'create'),
  ('users.read', 'View user information', 'users', 'users', 'read'),
  ('users.update', 'Update user information', 'users', 'users', 'update'),
  ('users.delete', 'Delete users', 'users', 'users', 'delete'),
  
  -- Document Management
  ('documents.create', 'Upload documents', 'documents', 'documents', 'create'),
  ('documents.read', 'View documents', 'documents', 'documents', 'read'),
  ('documents.update', 'Update documents', 'documents', 'documents', 'update'),
  ('documents.delete', 'Delete documents', 'documents', 'documents', 'delete'),
  ('documents.approve', 'Approve documents', 'documents', 'documents', 'approve'),
  
  -- Reports & Analytics
  ('reports.create', 'Generate reports', 'reports', 'reports', 'create'),
  ('reports.read', 'View reports', 'reports', 'reports', 'read'),
  ('reports.export', 'Export reports', 'reports', 'reports', 'export'),
  
  -- Settings
  ('settings.read', 'View settings', 'settings', 'settings', 'read'),
  ('settings.update', 'Update settings', 'settings', 'settings', 'update'),
  
  -- AI Features
  ('ai.use', 'Use AI assistant', 'ai', 'ai', 'use'),
  ('ai.admin', 'Manage AI settings', 'ai', 'ai', 'admin');

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to log audit trail
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    entreprise_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    COALESCE(NEW.entreprise_id, OLD.entreprise_id),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add profile_image_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
