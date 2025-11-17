# PDF Storage Database Setup

## Required: Add Columns to Supabase Database

Before the PDF viewer will work, you MUST add these columns to your `projects` table in Supabase.

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/bcuhyyyerxwgkrkbrqbs/sql/new
2. Paste the following SQL:

```sql
-- Add PDF storage columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS pdf_storage_path text,
ADD COLUMN IF NOT EXISTS pdf_filename text;

-- Add comment for documentation
COMMENT ON COLUMN projects.pdf_storage_path IS 'Storage path for screenplay PDF (e.g., projectId/timestamp_filename.pdf)';
COMMENT ON COLUMN projects.pdf_filename IS 'Original filename of uploaded PDF';
```

3. Click "Run" to execute the SQL

### Step 2: Regenerate TypeScript Types

After adding the columns, regenerate your Supabase types:

```bash
npx supabase gen types typescript --project-id bcuhyyyerxwgkrkbrqbs > supabase/type.ts
```

This will update the TypeScript types to include the new columns.

### Step 3: Remove Type Assertions

Once types are regenerated, you can remove the `as any` type assertions from `pdfStorage.ts`.

## How It Works

1. **Upload**: When a PDF is uploaded, the code saves both:
   - The file to Supabase Storage (`screenplay-pdfs` bucket)
   - The storage path and filename to the `projects` table

2. **Playback**: When viewing script playback:
   - Fetches the PDF storage path from the database
   - Generates a fresh signed URL (1-hour expiry)
   - Renders PDF in viewer with exact formatting

3. **Security**: PDFs are stored in a private bucket and accessed via signed URLs only.

## Verification

After running the SQL, verify the columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('pdf_storage_path', 'pdf_filename');
```

You should see both columns listed as `text` type.
