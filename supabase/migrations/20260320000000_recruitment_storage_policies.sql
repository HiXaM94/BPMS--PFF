-- Allow public (anon) uploads to the candidates/ folder in flowly-files bucket
-- This is required for applicants who are not logged in to upload their CVs

CREATE POLICY "Allow Public CV Upload"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'flowly-files' 
  AND (storage.foldername(name))[1] = 'candidates'
);

-- Allow public read access to CVs (so HR can view them)
-- Note: "Public Read Access" already exists for the whole bucket in some setups,
-- but we ensure it works for candidates/ folder.
CREATE POLICY "Allow Public CV Read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'flowly-files' 
  AND (storage.foldername(name))[1] = 'candidates'
);
