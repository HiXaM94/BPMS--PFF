-- Add profile_image_url column to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Also update user_details just in case if that's where details should go
-- but per request it should be in users table
