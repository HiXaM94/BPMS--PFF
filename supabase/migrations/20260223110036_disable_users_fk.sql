-- Drop the foreign key constraint on users.id to allow seeding with mock data
-- This constraint will be restored at the end of the seed.sql file
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;