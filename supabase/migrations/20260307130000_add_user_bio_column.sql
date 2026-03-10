-- Add bio column to users so profile edits can persist
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bio TEXT;
