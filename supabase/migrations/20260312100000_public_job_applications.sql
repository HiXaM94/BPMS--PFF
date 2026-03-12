-- Migration: Public Job Applications
-- Add fields to support public job postings and candidate applications

-- Add missing fields to recrutements table
ALTER TABLE recrutements
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'Full-time',
ADD COLUMN IF NOT EXISTS salary_range TEXT,
ADD COLUMN IF NOT EXISTS closing_date DATE,
ADD COLUMN IF NOT EXISTS applicants_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shortlisted_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Add missing fields to candidates table
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS applied_position TEXT,
ADD COLUMN IF NOT EXISTS score INTEGER,
ADD COLUMN IF NOT EXISTS cover_letter TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT;

-- Create storage bucket for CVs if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-cvs', 'candidate-cvs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for candidate CVs
CREATE POLICY "Anyone can upload CVs"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'candidate-cvs');

CREATE POLICY "Authenticated users can view CVs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'candidate-cvs');

CREATE POLICY "HR can delete CVs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'candidate-cvs' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'HR')
  )
);

-- RLS Policies for public job viewing
CREATE POLICY "Anyone can view public open jobs"
ON recrutements FOR SELECT
TO anon, authenticated
USING (status = 'open' AND is_public = true);

-- RLS Policies for public candidate applications
CREATE POLICY "Anyone can submit applications"
ON candidates FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "HR and Admin can view all candidates"
ON candidates FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'HR')
  )
);

CREATE POLICY "HR and Admin can update candidates"
ON candidates FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'HR')
  )
);

CREATE POLICY "HR and Admin can delete candidates"
ON candidates FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'HR')
  )
);

-- Function to increment applicant count
CREATE OR REPLACE FUNCTION increment_applicant_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE recrutements
  SET applicants_count = applicants_count + 1
  WHERE id = NEW.recrutement_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment applicant count
DROP TRIGGER IF EXISTS trg_increment_applicants ON candidates;
CREATE TRIGGER trg_increment_applicants
  AFTER INSERT ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION increment_applicant_count();

-- Function to decrement applicant count
CREATE OR REPLACE FUNCTION decrement_applicant_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE recrutements
  SET applicants_count = GREATEST(0, applicants_count - 1)
  WHERE id = OLD.recrutement_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-decrement applicant count
DROP TRIGGER IF EXISTS trg_decrement_applicants ON candidates;
CREATE TRIGGER trg_decrement_applicants
  AFTER DELETE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION decrement_applicant_count();

-- Create index for public job queries
CREATE INDEX IF NOT EXISTS idx_recrutements_public_open 
ON recrutements(status, is_public) 
WHERE status = 'open' AND is_public = true;

-- Comment on tables
COMMENT ON COLUMN recrutements.is_public IS 'Whether the job posting is visible on the public careers page';
COMMENT ON COLUMN recrutements.applicants_count IS 'Auto-incremented count of total applicants';
COMMENT ON COLUMN recrutements.shortlisted_count IS 'Count of shortlisted candidates';
COMMENT ON COLUMN candidates.score IS 'AI-generated score out of 100';
COMMENT ON COLUMN candidates.cover_letter IS 'Candidate cover letter or motivation';
