import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

// File storage configuration
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "10485760"); // 10MB default

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating upload directory:", error);
  }
}

// Generate a unique filename with the original extension
function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString("hex");
  return `${timestamp}-${randomString}${ext}`;
}

export async function POST(req: NextRequest) {
  try {
    // Ensure upload directory exists
    await ensureUploadDir();

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const applicationId = formData.get("applicationId") as string;

    // Validate file
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`,
        },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} is not allowed` },
        { status: 400 },
      );
    }

    // Create application-specific directory
    const appDir = applicationId
      ? path.join(UPLOAD_DIR, applicationId)
      : UPLOAD_DIR;
    await fs.mkdir(appDir, { recursive: true });

    // Generate unique filename and path
    const uniqueFilename = generateUniqueFilename(file.name);
    const filePath = path.join(appDir, uniqueFilename);
    const publicUrl = applicationId
      ? `/uploads/${applicationId}/${uniqueFilename}`
      : `/uploads/${uniqueFilename}`;

    // Convert file to buffer and save
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    console.log("File uploaded successfully:", filePath);

    return NextResponse.json({
      success: true,
      fid: Date.now(), // Use timestamp as numeric ID
      filename: file.name,
      url: publicUrl,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Error handling file upload:", error);
    return NextResponse.json(
      {
        error: "Error handling file upload",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
