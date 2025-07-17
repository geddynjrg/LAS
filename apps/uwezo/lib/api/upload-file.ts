"use client";

export interface UploadResponse {
  success: boolean;
  fid?: number;
  filename?: string;
  url?: string;
  size?: number;
  type?: string;
  error?: string;
  details?: string;
}

/**
 * Upload a file to the server using the /api/upload endpoint
 */
export async function uploadFile(
  file: File,
  applicationId?: string,
): Promise<UploadResponse> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    if (applicationId) {
      formData.append("applicationId", applicationId);
    }

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || `Upload failed with status: ${response.status}`,
      );
    }

    return result;
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Upload multiple files sequentially
 */
export async function uploadFiles(
  files: File[],
  applicationId?: string,
): Promise<UploadResponse[]> {
  const results: UploadResponse[] = [];

  for (const file of files) {
    const result = await uploadFile(file, applicationId);
    results.push(result);
  }

  return results;
}
