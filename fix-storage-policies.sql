-- Fix storage policies for correct path structure (without documents/ prefix)

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from documents" ON storage.objects;

-- Allow authenticated users to upload to documents bucket
CREATE POLICY "Allow authenticated uploads to documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);

-- Allow authenticated users to read from documents bucket
CREATE POLICY "Allow authenticated reads from documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);

-- Allow authenticated users to update files in documents bucket
CREATE POLICY "Allow authenticated updates in documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files in documents bucket
CREATE POLICY "Allow authenticated deletions in documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);
