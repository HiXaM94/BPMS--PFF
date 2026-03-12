-- Migration: Add created_at columns to candidates and recrutements tables
-- Fix: column candidates.created_at does not exist

-- Add created_at to candidates table if it doesn't exist
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add created_at to recrutements table if it doesn't exist
ALTER TABLE recrutements
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Set created_at to updated_at for existing records where created_at is null
UPDATE candidates
SET created_at = updated_at
WHERE created_at IS NULL;

UPDATE recrutements
SET created_at = updated_at
WHERE created_at IS NULL;

-- Add NOT NULL constraint after populating data
ALTER TABLE candidates
ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE recrutements
ALTER COLUMN created_at SET NOT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_candidates_created_at 
ON candidates(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recrutements_created_at 
ON recrutements(created_at DESC);

COMMENT ON COLUMN candidates.created_at IS 'Timestamp when the candidate application was submitted';
COMMENT ON COLUMN recrutements.created_at IS 'Timestamp when the job posting was created';
