-- Setup Supabase Storage for Profile Images and Documents
-- Bucket name: flowly-files

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('flowly-files', 'flowly-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Clear existing policies if any (to ensure clean setup)
-- Note: This requires admin/service_role permissions
-- DELETE FROM storage.policies WHERE bucket_id = 'flowly-files';

-- 3. Set up RLS Policies

-- Public access to read ANY file in the flowly-files bucket
-- This is needed so that profile images can be displayed globally
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'flowly-files' );

-- Authenticated users can upload files to the flowly-files bucket
-- We restrict this to specific paths in the application logic, 
-- but at the RLS level, we allow any authenticated user to start an upload.
CREATE POLICY "Authenticated Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'flowly-files' );

-- Users can only Update their own files
-- We determine ownership by checking if the uid in the path matches auth.uid()
-- Path format: entityType/userId/timestamp_filename
CREATE POLICY "Owner Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING ( 
  bucket_id = 'flowly-files' 
  AND (storage.foldername(name))[2] = auth.uid()::text 
);

-- Users can only Delete their own files
CREATE POLICY "Owner Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING ( 
  bucket_id = 'flowly-files' 
  AND (storage.foldername(name))[2] = auth.uid()::text 
);
