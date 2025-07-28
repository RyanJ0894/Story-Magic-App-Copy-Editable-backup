-- Supabase Storage Bucket Setup for Multi-Voice Audio Files

-- Note: Storage buckets are created through the Supabase Dashboard or Storage API
-- This script provides the commands you need to run in the Supabase Dashboard

-- 1. Create the user-files bucket (run this in Supabase Dashboard → Storage)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('user-files', 'user-files', true, 52428800, ARRAY['audio/wav', 'audio/mpeg', 'audio/mp3', 'text/plain', 'application/pdf']);

-- 2. Create storage policies for the user-files bucket
-- These policies allow authenticated users to upload and access files

-- Policy for inserting files (users can upload their own files)
CREATE POLICY "Users can upload files to user-files bucket" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'user-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy for selecting files (users can view their own files and public files)
CREATE POLICY "Users can view files in user-files bucket" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'user-files' AND (
            auth.uid()::text = (storage.foldername(name))[1] OR
            bucket_id IN (
                SELECT id FROM storage.buckets WHERE public = true
            )
        )
    );

-- Policy for updating files (users can update their own files)
CREATE POLICY "Users can update files in user-files bucket" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'user-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy for deleting files (users can delete their own files)
CREATE POLICY "Users can delete files in user-files bucket" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'user-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 3. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated; 