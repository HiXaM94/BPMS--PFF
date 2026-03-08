-- First, let's check if RLS is enabled on the documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;

-- Create policies that match the actual table structure
-- These policies use the column names that actually exist in the table

-- Allow users to view their own documents
CREATE POLICY "Users can view their own documents"
ON documents
FOR SELECT
USING (auth.uid()::text = user_id::text);

-- Allow users to insert their own documents
CREATE POLICY "Users can insert their own documents"
ON documents
FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

-- Allow users to update their own documents
CREATE POLICY "Users can update their own documents"
ON documents
FOR UPDATE
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON documents
FOR DELETE
USING (auth.uid()::text = user_id::text);

-- Allow HR/Admin to view all documents in their entreprise
CREATE POLICY "HR/Admin can view all entreprise documents"
ON documents
FOR SELECT
USING (
  auth.role() IN ('HR', 'ADMIN') AND 
  entreprise_id = (
    SELECT entreprise_id 
    FROM users 
    WHERE id = auth.uid()
  )
);

-- Allow HR/Admin to update documents in their entreprise
CREATE POLICY "HR/Admin can update entreprise documents"
ON documents
FOR UPDATE
USING (
  auth.role() IN ('HR', 'ADMIN') AND 
  entreprise_id = (
    SELECT entreprise_id 
    FROM users 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  auth.role() IN ('HR', 'ADMIN') AND 
  entreprise_id = (
    SELECT entreprise_id 
    FROM users 
    WHERE id = auth.uid()
  )
);
