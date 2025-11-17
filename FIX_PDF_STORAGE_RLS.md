# Fix PDF Storage RLS (Row Level Security)

## Problem

Console error: `"new row violates row-level security policy"`

This means the `screenplay-pdfs` bucket exists but RLS is blocking uploads.

## Solution

Go to your Supabase Storage policies page:
https://supabase.com/dashboard/project/bcuhyyyerxwgkrkbrqbs/storage/policies

### Step 1: Find screenplay-pdfs Bucket

Click on the `screenplay-pdfs` bucket in the list.

### Step 2: Add Upload Policy

Click "New Policy" and add this policy:

**Policy Name**: `Allow authenticated users to upload PDFs`

**Allowed Operation**: `INSERT`

**Target Roles**: `authenticated`

**Policy Definition**:
```sql
(bucket_id = 'screenplay-pdfs'::text)
```

### Step 3: Add Read Policy

Click "New Policy" again and add this policy:

**Policy Name**: `Allow authenticated users to read their PDFs`

**Allowed Operation**: `SELECT`

**Target Roles**: `authenticated`

**Policy Definition**:
```sql
(bucket_id = 'screenplay-pdfs'::text)
```

### Step 4: Add Update Policy (for signed URLs)

Click "New Policy" again:

**Policy Name**: `Allow authenticated users to update PDFs`

**Allowed Operation**: `UPDATE`

**Target Roles**: `authenticated`

**Policy Definition**:
```sql
(bucket_id = 'screenplay-pdfs'::text)
```

### Quick Alternative (If Above Doesn't Work)

If the UI is confusing, run this SQL instead:

Go to: https://supabase.com/dashboard/project/bcuhyyyerxwgkrkbrqbs/sql/new

```sql
-- Allow authenticated users to upload PDFs
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'screenplay-pdfs');

-- Allow authenticated users to read PDFs
CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'screenplay-pdfs');

-- Allow authenticated users to update PDFs (for signed URLs)
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'screenplay-pdfs');
```

## Verification

After adding the policies, try uploading a screenplay PDF again. Check browser console - you should see:

✅ `"✅ PDF uploaded and metadata saved"`

Instead of:

❌ `"PDF upload failed: new row violates row-level security policy"`

## Why This Happened

Private buckets in Supabase have RLS enabled by default, which blocks ALL operations unless you explicitly allow them with policies.
