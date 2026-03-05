-- Add rejection_reason column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update RLS if necessary (usually not needed if already granted for all columns)
-- Just ensuring the column is searchable and readable for managers and employees
COMMENT ON COLUMN tasks.rejection_reason IS 'Reason provided by manager when a task validation is rejected.';
