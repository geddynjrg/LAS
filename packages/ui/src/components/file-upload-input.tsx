"use client";

import { IconCamera } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import {
  Fragment,
  useCallback,
  useEffect,
  useState,
  useTransition,
  type FC,
} from "react";
import type { Accept, ErrorCode, FileError } from "react-dropzone";

import { Attachment } from "@workspace/ui/components/attachment";
import {
  Dropzone,
  DropzoneDragAccepted,
  DropzoneDragDefault,
  DropzoneDragRejected,
  DropzoneInput,
  DropzoneRejected,
  DropzoneUploadIcon,
  DropzoneZone,
} from "@workspace/ui/components/dropzone";
import { cn } from "@workspace/ui/lib/utils";

type ServerFile = { fid: string; filename: string; url: string };

export type FileUploadInputValue = File | ServerFile | string;

export interface FileUploadInputProps {
  accept: Accept;
  maxSize: number;
  name?: string;
  multiple?: boolean;
  disabled?: boolean;
  defaultValue?: FileUploadInputValue | FileUploadInputValue[];
  attachmentBgInverted?: boolean;
  "aria-invalid"?: boolean;
  "data-invalid"?: boolean;
  // Upload functionality props
  applicationId?: string;
  enableUpload?: boolean;
  onUploadProgress?: (progress: number) => void;
  onUploadError?: (error: string) => void;
  onChange?: (value: any) => void;
  // Server action props (modern approach)
  uploadAction?: (prev: any, formData: FormData) => any;
  onUploadComplete?: (files: ServerFile[]) => void;
}

export const FileUploadInput: FC<FileUploadInputProps> = ({
  accept,
  maxSize,
  name,
  multiple = false,
  disabled,
  defaultValue,
  attachmentBgInverted = false,
  applicationId,
  enableUpload = false,
  onUploadProgress,
  onUploadError,
  onChange,
  uploadAction,
  onUploadComplete,
  ...props
}) => {
  const t = useTranslations("FileUploadInput");

  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const [files, setFiles] = useState<FileUploadInputValue[] | null>(
    defaultValue
      ? Array.isArray(defaultValue)
        ? defaultValue
        : [defaultValue]
      : null,
  );

  // Upload-related state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<ServerFile[]>([]);

  // Server action state
  const [isPending, startTransition] = useTransition();

  const hasImageType = "image/*" in accept;
  const serverFiles = files?.filter(isServerFile);

  // "capture" prop works only for image/* MIME type. Exclude other MIME types when picture button is pressed.
  const acceptWithCamera =
    isCameraEnabled && hasImageType
      ? ({ "image/*": accept["image/*"] } as Accept)
      : accept;

  // Convert accept object to allowed MIME types for validation
  const allowedTypes = Object.entries(accept).flatMap(
    ([mimeType, extensions]) => {
      if (mimeType === "image/*") {
        return [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
          "image/gif",
          "image/bmp",
          "image/svg+xml",
        ];
      }
      return [mimeType];
    },
  );

  // Upload function
  const uploadFile = useCallback(
    async (file: File): Promise<ServerFile | null> => {
      if (!applicationId) return null;

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} is not allowed`);
      }

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("applicationId", applicationId);

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

        if (result.success) {
          return {
            fid: result.fid?.toString() || "",
            filename: result.filename || file.name,
            url: result.url || "",
          };
        }

        return null;
      } catch (error) {
        console.error("Upload error:", error);
        throw error;
      }
    },
    [applicationId, allowedTypes],
  );

  const handleAddFiles = useCallback(
    async (newFiles: FileUploadInputValue[]) => {
      // Clear previous upload error
      setUploadError(null);

      // Prioritize server action over legacy upload
      if (uploadAction && applicationId) {
        // Handle file upload with server action
        const filesToUpload = newFiles.filter(
          (file): file is File => file instanceof File,
        );

        if (filesToUpload.length === 0) {
          return;
        }

        // Client-side validation
        const validationErrors: string[] = [];
        for (const file of filesToUpload) {
          if (file.size > maxSize) {
            validationErrors.push(
              `File "${file.name}" exceeds maximum size limit of ${Math.round(maxSize / 1024 / 1024)}MB`,
            );
          }
          if (!allowedTypes.includes(file.type)) {
            validationErrors.push(
              `File type "${file.type}" is not allowed for file "${file.name}"`,
            );
          }
        }

        if (validationErrors.length > 0) {
          setUploadError(validationErrors.join(", "));
          onUploadError?.(validationErrors.join(", "));
          return;
        }

        startTransition(async () => {
          try {
            const formData = new FormData();

            if (applicationId) {
              formData.append("applicationId", applicationId);
            }

            // Add files to form data
            if (multiple) {
              filesToUpload.forEach((file) => {
                formData.append("files", file);
              });
            } else {
              formData.append("file", filesToUpload[0]!);
            }

            const result = await uploadAction(null, formData);

            if (result.success) {
              // Handle successful upload
              const uploadResults = result.files || [];
              setUploadedFiles((prev) => [...prev, ...uploadResults]);
              onUploadComplete?.(uploadResults);

              // Add uploaded files to the files state
              setFiles((prevFiles) => {
                const allFiles = [...(prevFiles || []), ...uploadResults];
                const existingFiles = new Set(allFiles.map(getFileName));
                return allFiles.filter(
                  (file, index, arr) =>
                    arr.findIndex(
                      (f) => getFileName(f) === getFileName(file),
                    ) === index,
                );
              });
            } else {
              // Handle upload errors
              const errorMessages = result.errors
                ? Object.values(result.errors).flat().join(", ")
                : result.error || "Upload failed";
              setUploadError(errorMessages);
              onUploadError?.(errorMessages);
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Upload failed";
            setUploadError(errorMessage);
            onUploadError?.(errorMessage);
          }
        });
      } else if (enableUpload && applicationId) {
        // Legacy file upload with fetch
        setIsUploading(true);
        setUploadProgress(0);

        const filesToUpload = newFiles.filter(
          (file): file is File => file instanceof File,
        );
        const totalFiles = filesToUpload.length;
        const uploadedServerFiles: ServerFile[] = [];

        for (let i = 0; i < filesToUpload.length; i++) {
          const file = filesToUpload[i];
          if (!file) continue;

          // Validate file
          if (file.size > maxSize) {
            const error = `File "${file.name}" exceeds maximum size limit`;
            setUploadError(error);
            onUploadError?.(error);
            continue;
          }

          try {
            const uploadedFile = await uploadFile(file);
            if (uploadedFile) {
              uploadedServerFiles.push(uploadedFile);
              setUploadedFiles((prev) => [...prev, uploadedFile]);
            }

            // Update progress
            const progress = ((i + 1) / totalFiles) * 100;
            setUploadProgress(progress);
            onUploadProgress?.(progress);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Upload failed";
            setUploadError(errorMessage);
            onUploadError?.(errorMessage);
          }
        }

        setIsUploading(false);

        // Add uploaded files to the files state
        setFiles((prevFiles) => {
          const allFiles = [...(prevFiles || []), ...uploadedServerFiles];
          const existingFiles = new Set(allFiles.map(getFileName));
          return allFiles.filter(
            (file, index, arr) =>
              arr.findIndex((f) => getFileName(f) === getFileName(file)) ===
              index,
          );
        });
      } else {
        // Original behavior without upload
        setFiles((prevFiles) => {
          if (!prevFiles) {
            return newFiles;
          }

          // If the files are already present, do not add them again
          const existingFiles = new Set(prevFiles.map(getFileName));
          const filteredNewFiles = newFiles.filter(
            (file) => !existingFiles.has(getFileName(file)),
          );

          return [...prevFiles, ...filteredNewFiles];
        });
      }
    },
    [
      uploadAction,
      applicationId,
      maxSize,
      allowedTypes,
      multiple,
      onUploadComplete,
      enableUpload,
      uploadFile,
      onUploadProgress,
      onUploadError,
    ],
  );

  function handleReset() {
    setFiles(serverFiles ?? null);
    setResetCount((prev) => prev + 1);
    setUploadError(null);
    setUploadProgress(0);
  }

  // Enhanced delete function to handle uploaded files
  const handleDelete = useCallback((index: number) => {
    setFiles((prevFiles) => {
      if (!prevFiles) {
        return null;
      }

      const fileToDelete = prevFiles[index];
      const newFiles = [...prevFiles];
      newFiles.splice(index, 1);

      // If it's an uploaded file, remove it from uploadedFiles as well
      if (fileToDelete && isServerFile(fileToDelete)) {
        setUploadedFiles((prev) =>
          prev.filter((f) => f.fid !== fileToDelete.fid),
        );
      }

      return newFiles.length ? newFiles : null;
    });
  }, []);

  // Notify parent of changes
  useEffect(() => {
    if (onChange && files) {
      const value = multiple ? files : files[0] || null;

      // Create a synthetic event object that matches what form controls expect
      const syntheticEvent = {
        target: { value },
        currentTarget: { value },
        preventDefault: () => {},
        stopPropagation: () => {},
        defaultPrevented: false,
        type: "change",
        bubbles: false,
        cancelable: false,
        timeStamp: Date.now(),
      } as React.ChangeEvent<HTMLInputElement>;

      onChange(syntheticEvent);
    }
  }, [files, multiple, onChange]);

  return (
    <Dropzone
      key={resetCount}
      accept={acceptWithCamera}
      multiple={multiple}
      maxSize={maxSize}
      disabled={disabled || isUploading || isPending}
      onDrop={handleAddFiles}
    >
      <DropzoneInput
        name={
          files && files.some(isValidFile)
            ? multiple
              ? `${name}`
              : name
            : undefined /* Don't submit if only server files (they use hidden inputs) */
        }
        capture={hasImageType && isCameraEnabled}
        value={files === null ? null : files?.filter(isValidFile)}
        // aria-invalid={props["aria-invalid"]}
        // data-invalid={props["data-invalid"]}
        // {...props}
      />

      {serverFiles?.map((file, index) => {
        const namePrefix = multiple ? `${name}.${index}` : name;
        return (
          <Fragment key={`${file.fid}-${index}`}>
            {/* Hidden inputs for server files */}
            <input type="hidden" name={`${namePrefix}.fid`} value={file.fid} />
            <input
              type="hidden"
              name={`${namePrefix}.filename`}
              value={file.filename}
            />
            <input type="hidden" name={`${namePrefix}.url`} value={file.url} />
          </Fragment>
        );
      })}

      <fieldset
        className="stagnation flex items-center justify-center gap-4"
        aria-invalid={props["aria-invalid"]}
        data-invalid={props["data-invalid"]}
      >
        {isUploading || isPending ? (
          // Upload progress display
          <div className="flex w-full flex-col items-center justify-center gap-2 p-4">
            <div className="text-sm font-medium">Uploading...</div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              {isPending ? (
                <div className="h-2 w-full animate-pulse rounded-full bg-blue-600" />
              ) : (
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              )}
            </div>
            <div className="text-xs text-gray-600">
              {isPending
                ? "Processing files..."
                : `${Math.round(uploadProgress)}% complete`}
            </div>
          </div>
        ) : (
          <>
            {hasImageType && (
              <>
                {/* picture */}
                <DropzoneZone
                  onMouseDown={() => setIsCameraEnabled(true)}
                  className="flex flex-1 items-center justify-center gap-2 [.device-type-desktop_&]:hidden"
                >
                  <IconCamera className="size-5 text-neutral-500" />
                  {t("takePicture")}
                </DropzoneZone>

                <span className="[.device-type-desktop_&]:hidden">
                  {t("or")}
                </span>
              </>
            )}

            {/* file */}
            <DropzoneZone
              onMouseDown={() => setIsCameraEnabled(false)}
              className="flex flex-1 items-center justify-center gap-2"
            >
              <DropzoneUploadIcon />
              <DropzoneDragAccepted>{t("chooseFile")}</DropzoneDragAccepted>
              <DropzoneDragRejected>{t("chooseFile")}</DropzoneDragRejected>
              <DropzoneDragDefault>{t("chooseFile")}</DropzoneDragDefault>
            </DropzoneZone>
          </>
        )}
      </fieldset>

      {/* Upload Error Display */}
      {uploadError && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-3">
          <div className="flex items-start justify-between">
            <div className="text-sm text-red-800">{uploadError}</div>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="ml-2 font-medium text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {files && (
        <ul className="mt-4 space-y-2">
          {files.map((file, index) => (
            <Attachment
              key={index}
              className={cn(
                "shadow",
                attachmentBgInverted && "bg-site-background",
              )}
              url={
                typeof file === "object" && "url" in file ? file.url : undefined
              }
              onDelete={() => handleDelete(index)}
            >
              {getFileName(file)}
            </Attachment>
          ))}
        </ul>
      )}

      <DropzoneRejected>
        {(files) =>
          !!files.length && (
            <ul className="mt-4 space-y-2">
              {files.map((file) => (
                <Attachment
                  key={file.file.name}
                  className="shadow"
                  error={getTranslatedError(file.errors, t)}
                  onDelete={handleReset}
                >
                  {file.file.name}
                </Attachment>
              ))}
            </ul>
          )
        }
      </DropzoneRejected>
    </Dropzone>
  );
};

function getFileName(file: FileUploadInputValue) {
  if (typeof file === "string") {
    return file;
  }

  if (isValidFile(file)) {
    return file.name;
  }

  if (typeof file === "object" && file !== null) {
    return file.filename;
  }

  return "";
}

function isServerFile(file: FileUploadInputValue): file is ServerFile {
  return (
    file !== null &&
    typeof file === "object" &&
    typeof file !== "string" &&
    "fid" in file &&
    "filename" in file &&
    "url" in file
  );
}

function getTranslatedError(
  errors: readonly FileError[],
  t: ReturnType<typeof useTranslations>,
) {
  return errors
    .map((error) => t(`errors.${error.code as ErrorCode}`))
    .join(", ");
}

function isValidFile(file: unknown): file is File {
  // Check if File is defined (browser environment)
  if (typeof File !== "undefined" && file instanceof File) {
    // check if file actually exists, assigning zero byte files to file input can crash browser
    return file.size > 0;
  }

  return false;
}
