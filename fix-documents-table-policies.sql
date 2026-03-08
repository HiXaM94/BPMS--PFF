-- Fix RLS policies for documents table

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;

-- Allow users to view their own documents
CREATE POLICY "Users can view their own documents"
ON documents
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own documents
CREATE POLICY "Users can insert their own documents"
ON documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own documents
CREATE POLICY "Users can update their own documents"
ON documents
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON documents
FOR DELETE
USING (auth.uid() = user_id);

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
