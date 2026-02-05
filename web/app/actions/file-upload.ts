'use server';

import type { FormAction } from '@workspace/ui/hooks/use-form';
import { isFileUpload } from '@workspace/ui/lib/utils';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

// File storage configuration (private directory, not in public)
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/svg+xml',
  'application/pdf',
];

// Generate a unique filename with the original extension
function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${randomString}${ext}`;
}

// Ensure upload directory exists
async function ensureUploadDir(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
    throw new Error('Failed to create upload directory');
  }
}

export interface FileUploadResult {
  fid: string;
  filename: string;
  url: string;
  size: number;
  type: string;
}

export interface FileUploadResponse {
  success: boolean;
  files?: FileUploadResult[];
  error?: string;
  errors?: Record<string, string[]>;
}

export const uploadFileAction: FormAction<{
  files: File[];
  applicationId?: string;
}> = async (_prev, formData) => {
  const applicationId = formData.get('applicationId')?.toString();
  const files: File[] = [];

  // Extract all files from form data
  for (const [key, value] of formData.entries()) {
    if (key === 'file' || key.startsWith('files')) {
      if (isFileUpload(value)) {
        files.push(value as File);
      }
    }
  }

  const values = { files, applicationId };

  try {
    if (files.length === 0) {
      return {
        success: false,
        errors: { files: ['No files provided'] },
        values,
      };
    }

    // Ensure base upload directory exists
    await ensureUploadDir(UPLOAD_DIR);
    console.log('Base upload directory ensured at:', UPLOAD_DIR);
    // Create application-specific directory if applicationId is provided
    const appDir = applicationId
      ? path.join(UPLOAD_DIR, applicationId)
      : UPLOAD_DIR;

    if (applicationId) {
      await ensureUploadDir(appDir);
    }

    const uploadedFiles: FileUploadResult[] = [];
    const errors: Record<string, string[]> = {};

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;

      const fieldKey = `file_${i}`;

      try {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          errors[fieldKey] = [
            `File "${file.name}" exceeds maximum size limit of ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
          ];
          continue;
        }

        // Validate file type
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          errors[fieldKey] = [
            `File type "${file.type}" is not allowed for file "${file.name}"`,
          ];
          continue;
        }

        // Generate unique filename and path
        const uniqueFilename = generateUniqueFilename(file.name);
        const filePath = path.join(appDir, uniqueFilename);
        const publicUrl = applicationId
          ? `/files/${applicationId}/${uniqueFilename}`
          : `/files/misc/${uniqueFilename}`;

        // Convert file to buffer and save
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        await fs.writeFile(filePath, buffer);

        const uploadResult: FileUploadResult = {
          fid: Date.now().toString() + i.toString(), // Ensure unique ID
          filename: file.name,
          url: publicUrl,
          size: file.size,
          type: file.type,
        };

        uploadedFiles.push(uploadResult);
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        errors[fieldKey] = [
          `Failed to upload file "${file.name}": ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        ];
      }
    }

    // Return success if at least one file was uploaded
    if (uploadedFiles.length > 0) {
      return {
        success: true,
        files: uploadedFiles,
        ...(Object.keys(errors).length === 0 && { values }),
      };
    }

    // Return error if no files were uploaded
    return {
      success: false,
      errors:
        Object.keys(errors).length > 0
          ? errors
          : { files: ['Failed to upload any files'] },
      values,
    };
  } catch (error) {
    console.error('Error in uploadFileAction:', error);
    return {
      success: false,
      errors: {
        files: [
          `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      },
      values,
    };
  }
};

export const uploadSingleFileAction: FormAction<{
  file: File;
  applicationId?: string;
}> = async (_prev, formData) => {
  console.log('Starting uploadSingleFileAction');
  const applicationId = formData.get('applicationId')?.toString();
  const file = formData.get('file') as File;
  const values = { file, applicationId };

  try {
    if (!file || !isFileUpload(file)) {
      return {
        success: false,
        errors: { file: ['No file provided'] },
        values,
      };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        errors: {
          file: [
            `File exceeds maximum size limit of ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
          ],
        },
        values,
      };
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        errors: { file: [`File type "${file.type}" is not allowed`] },
        values,
      };
    }

    // Ensure base upload directory exists
    await ensureUploadDir(UPLOAD_DIR);

    // Create application-specific directory if applicationId is provided
    const appDir = applicationId
      ? path.join(UPLOAD_DIR, applicationId)
      : UPLOAD_DIR;

    if (applicationId) {
      await ensureUploadDir(appDir);
    }

    // Generate unique filename and path
    const uniqueFilename = generateUniqueFilename(file.name);
    const filePath = path.join(appDir, uniqueFilename);
    const publicUrl = applicationId
      ? `/files/${applicationId}/${uniqueFilename}`
      : `/files/misc/${uniqueFilename}`;

    // Convert file to buffer and save
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    const uploadResult: FileUploadResult = {
      fid: Date.now().toString(),
      filename: file.name,
      url: publicUrl,
      size: file.size,
      type: file.type,
    };

    return {
      success: true,
      files: [uploadResult],
    };
  } catch (error) {
    console.error('Error in uploadSingleFileAction:', error);
    return {
      success: false,
      errors: {
        file: [
          `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      },
      values,
    };
  }
};
