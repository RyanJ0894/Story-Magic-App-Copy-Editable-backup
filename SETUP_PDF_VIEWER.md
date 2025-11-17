# PDF Viewer Setup Instructions

This document describes the required Supabase setup to enable exact PDF formatting in the script playback view.

## Overview

The application now supports uploading screenplay PDF files and displaying them with **exact formatting** during playback, instead of reformatting the text. This provides a page-by-page view that looks exactly like the original PDF.

## Required Supabase Setup

### 1. Create Storage Bucket

You need to create a **private** storage bucket for screenplay PDFs:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/bcuhyyyerxwgkrkbrqbs/storage/buckets
2. Click "New Bucket"
3. Set bucket name: `screenplay-pdfs`
4. Set to **Private** (for security - PDFs contain sensitive screenplay content)
5. Click "Create Bucket"

**Note**: PDFs are accessed via signed URLs (1-hour expiry) instead of public URLs for security.

### 2. Update Database Schema (Optional)

To track PDF files in the database, add these columns to the `projects` table:

```sql
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS pdf_storage_path text,
ADD COLUMN IF NOT EXISTS pdf_public_url text;
```

These columns are optional - the system will work without them, but they allow you to track which projects have PDFs.

## How It Works

### Upload Flow

1. User uploads a PDF file via the "Upload PDF" button
2. Text is extracted from the PDF for processing (unchanged)
3. **NEW**: The original PDF file is also uploaded to Supabase Storage
4. PDF URL is stored and passed to the playback viewer

### Playback View

When a PDF has been uploaded:

- **PDF Viewer** renders the exact PDF pages using pdf.js
- Page-by-page navigation (Previous/Next buttons)
- Page counter shows current page and total pages
- Audio player synchronized to the PDF content

When no PDF is available:

- **Text Viewer** (original behavior) shows reformatted screenplay text
- Auto-scroll highlighting still works

## Features

### PDF Playback Viewer

- ✅ Renders exact PDF formatting (no reformatting)
- ✅ Page-by-page navigation
- ✅ High-DPI display support (retina screens)
- ✅ Audio player integration
- ✅ Dark theme (#0f0f0f background)
- ⏳ Highlighting (coming soon - requires text layer mapping)

### Fallback to Text View

If no PDF is uploaded, the system falls back to the text-based screenplay viewer with auto-scroll highlighting.

## File Storage Details

- **Bucket**: `screenplay-pdfs` (private)
- **Path**: `{projectId}/{timestamp}_{sanitized_filename}.pdf`
- **Access**: Signed URLs with 1-hour expiry (secure)
- **Cleanup**: PDFs remain until manually deleted
- **Security**: Private bucket prevents unauthorized access to sensitive screenplay content

## Testing

1. Create a new project
2. Upload a screenplay PDF
3. Wait for audio generation to complete
4. Click "View Script Playback"
5. You should see the PDF rendered exactly as it appears in the original file

## Troubleshooting

### "Failed to upload PDF" Error

- Check that the `screenplay-pdfs` bucket exists in Supabase
- Verify bucket is set to **Private** (for security)
- Check browser console for detailed error messages
- Ensure your user has appropriate storage permissions

### PDF Not Displaying

- Verify the signed PDF URL is correct (check browser console)
- Ensure the bucket is set to **Private** (not Public)
- Check that signed URLs are being generated (1-hour expiry)
- Try accessing the signed URL directly in a new tab to test

### Workflow Still Shows Text View

- Ensure you uploaded a PDF file (not just pasted text)
- Check the "PDF loaded: filename.pdf" message appears after upload
- Verify the PDF was successfully uploaded (no error toasts)

## Next Steps

The current implementation provides exact PDF rendering but does not yet include:

1. **Audio-synchronized highlighting** - Requires mapping audio timestamps to PDF text layer coordinates
2. **Auto-scroll across pages** - Needs to detect which page contains the currently playing dialogue
3. **Search/navigation** - Jump to specific scenes or characters

These features will be implemented in future updates.
