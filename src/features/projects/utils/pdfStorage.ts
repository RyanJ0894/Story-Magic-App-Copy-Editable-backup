import { supabase } from "@/integrations/supabase/client";

const BUCKET_NAME = "screenplay-pdfs";

export interface PdfUploadResult {
  storagePath: string;
  signedUrl: string;
}

/**
 * Upload a PDF file to Supabase Storage (private bucket with signed URL access)
 */
export async function uploadPdfFile(
  file: File,
  projectId: string
): Promise<PdfUploadResult> {
  // Create storage path: {projectId}/{timestamp}_{filename}
  const timestamp = Date.now();
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `${projectId}/${timestamp}_${sanitizedFilename}`;

  // Upload file to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("PDF upload failed:", error);
    throw new Error(`Failed to upload PDF: ${error.message}`);
  }

  // Get signed URL (valid for 1 hour)
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, 3600);

  if (signedUrlError || !signedUrlData) {
    console.error("Failed to create signed URL:", signedUrlError);
    throw new Error("Failed to create signed URL for PDF");
  }

  return {
    storagePath: data.path,
    signedUrl: signedUrlData.signedUrl,
  };
}

/**
 * Get a signed URL for an existing PDF (1 hour expiry)
 */
export async function getPdfSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, 3600);

  if (error || !data) {
    console.error("Failed to create signed URL:", error);
    throw new Error("Failed to create signed URL for PDF");
  }

  return data.signedUrl;
}

/**
 * Delete a PDF file from Supabase Storage
 */
export async function deletePdfFile(storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);

  if (error) {
    console.error("PDF deletion failed:", error);
    throw new Error(`Failed to delete PDF: ${error.message}`);
  }
}
