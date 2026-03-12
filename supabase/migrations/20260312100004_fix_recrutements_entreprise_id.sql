-- Migration: Fix recrutements table to handle missing entreprise_id
-- The application doesn't always provide entreprise_id when creating jobs
-- Solution: Make entreprise_id nullable and add a trigger to auto-populate it

-- Make entreprise_id nullable (temporarily for existing records)
ALTER TABLE recrutements
ALTER COLUMN entreprise_id DROP NOT NULL;

-- Create function to auto-populate entreprise_id from user's profile
CREATE OR REPLACE FUNCTION auto_set_recrutement_entreprise()
RETURNS TRIGGER AS $$
BEGIN
  -- If entreprise_id is not provided, get it from the user's profile
  IF NEW.entreprise_id IS NULL THEN
    SELECT u.entreprise_id INTO NEW.entreprise_id
    FROM users u
    WHERE u.id = auth.uid();
    
    -- If still null, try to get the first entreprise (for development)
    IF NEW.entreprise_id IS NULL THEN
      SELECT id INTO NEW.entreprise_id
      FROM entreprises
      LIMIT 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-set entreprise_id
DROP TRIGGER IF EXISTS trg_auto_set_recrutement_entreprise ON recrutements;
CREATE TRIGGER trg_auto_set_recrutement_entreprise
  BEFORE INSERT ON recrutements
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_recrutement_entreprise();

-- Update existing records that might have NULL entreprise_id
UPDATE recrutements
SET entreprise_id = (SELECT id FROM entreprises LIMIT 1)
WHERE entreprise_id IS NULL;

-- Now make it NOT NULL again (after populating)
ALTER TABLE recrutements
ALTER COLUMN entreprise_id SET NOT NULL;

COMMENT ON FUNCTION auto_set_recrutement_entreprise() IS 'Auto-populates entreprise_id for job postings from user profile';
