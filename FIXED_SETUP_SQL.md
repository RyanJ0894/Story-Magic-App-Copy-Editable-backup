# Fixed Setup SQL for PDF Viewer

## Run This SQL in Supabase

Go to: https://supabase.com/dashboard/project/bcuhyyyerxwgkrkbrqbs/sql/new

Copy and paste this **exact** SQL:

```sql
-- Step 1: Add database columns for PDF metadata
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS pdf_storage_path text,
ADD COLUMN IF NOT EXISTS pdf_filename text;

-- Step 2: Drop existing policies if they exist (won't error if they don't exist)
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;

-- Step 3: Create new RLS policies for PDF storage
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'screenplay-pdfs');

CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'screenplay-pdfs');

CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'screenplay-pdfs');
```

Click **"Run"**.

This should complete successfully without errors.

## What This Does

1. ✅ Adds `pdf_storage_path` and `pdf_filename` columns to your `projects` table
2. ✅ Removes any old/conflicting storage policies
3. ✅ Creates new RLS policies that allow authenticated users to upload/read PDFs

## After Running

1. Upload ANSWERS.pdf in the app
2. You should see: ✅ `"PDF uploaded and metadata saved"` in browser console
3. Click "View Script Playback"  
4. **You'll see the PDF rendered page-by-page** (not the text viewer)
