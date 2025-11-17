import { supabase } from "@/integrations/supabase/client";

const BUCKET_NAME = "screenplay-pdfs";

export interface PdfUploadResult {
  storagePath: string;
  signedUrl: string;
}

/**
 * Upload a PDF file to Supabase Storage (private bucket with signed URL access)
 * Also saves PDF metadata to the projects table
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

  // Save PDF metadata to projects table
  const { error: updateError } = await supabase
    .from("projects")
    .update({
      pdf_storage_path: data.path,
      pdf_filename: file.name,
    } as any) // Type assertion - columns exist in Supabase but not in generated types yet
    .eq("id", projectId);

  if (updateError) {
    console.error("Failed to save PDF metadata to project:", updateError);
    // Don't throw - file is uploaded, just metadata save failed
  }

  // Get signed URL (valid for 1 hour)
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, 3600);

  if (signedUrlError || !signedUrlData) {
    console.error("Failed to create signed URL:", signedUrlError);
    throw new Error("Failed to create signed URL for PDF");
  }

  console.log("✅ PDF uploaded and metadata saved:", {
    storagePath: data.path,
    filename: file.name,
    projectId,
  });

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
 * Get the PDF URL for a project (fetches from database and generates signed URL)
 * Returns null if project has no PDF
 */
export async function getProjectPdfUrl(projectId: string): Promise<string | null> {
  // Fetch project to get PDF storage path
  const { data: project, error } = await supabase
    .from("projects")
    .select("pdf_storage_path")
    .eq("id", projectId)
    .single();

  if (error) {
    console.error("Failed to fetch project PDF path:", error);
    return null;
  }

  // No PDF stored for this project
  if (!project?.pdf_storage_path) {
    return null;
  }

  // Generate signed URL
  try {
    const signedUrl = await getPdfSignedUrl(project.pdf_storage_path as string);
    return signedUrl;
  } catch (error) {
    console.error("Failed to generate PDF signed URL:", error);
    return null;
  }
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
