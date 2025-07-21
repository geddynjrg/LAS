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
  // Delete action prop
  deleteAction?: (
    file: FileUploadInputValue,
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteCompleted?: (deletedFile: FileUploadInputValue) => void;
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
  deleteAction,
  onDeleteCompleted,
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
  const [deletingFiles, setDeletingFiles] = useState<Set<number>>(new Set());

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
  const allowedTypes = Object.entries(accept).flatMap(([mimeType, _]) => {
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
  });

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

      // Validate file count for single file uploads
      if (!multiple && newFiles.length > 1) {
        const error =
          "Only one file can be uploaded at a time. Please select a single file.";
        setUploadError(error);
        onUploadError?.(error);
        return;
      }

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
                if (!multiple) {
                  // For single file uploads, replace existing files
                  return uploadResults;
                }

                // For multiple file uploads, append and remove duplicates
                const allFiles = [...(prevFiles || []), ...uploadResults];
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
          if (!multiple) {
            // For single file uploads, replace existing files
            return uploadedServerFiles;
          }

          // For multiple file uploads, append and remove duplicates
          const allFiles = [...(prevFiles || []), ...uploadedServerFiles];
          return allFiles.filter(
            (file, index, arr) =>
              arr.findIndex((f) => getFileName(f) === getFileName(file)) ===
              index,
          );
        });
      } else {
        // Original behavior without upload
        setFiles((prevFiles) => {
          if (!multiple) {
            // For single file uploads, replace existing files
            return newFiles;
          }

          if (!prevFiles) {
            return newFiles;
          }

          // For multiple file uploads, avoid duplicates
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
    if (!multiple && files && files.length > 0) {
      // For single file uploads, clear everything
      setFiles(null);
    } else {
      // For multiple file uploads, keep only server files (already uploaded)
      setFiles(serverFiles ?? null);
    }
    setResetCount((prev) => prev + 1);
    setUploadError(null);
    setUploadProgress(0);
  }

  // Enhanced delete function to handle uploaded files
  const handleDelete = useCallback(
    async (index: number) => {
      const fileToDelete = files?.[index];
      if (!fileToDelete) return;

      // Set deleting state
      setDeletingFiles((prev) => new Set(prev).add(index));

      // If deleteAction is provided, call it first
      if (deleteAction) {
        try {
          const result = await deleteAction(fileToDelete);
          if (!result.success) {
            const errorMessage = result.error || "Failed to delete file";
            setUploadError(errorMessage);
            onUploadError?.(errorMessage);
            setDeletingFiles((prev) => {
              const newSet = new Set(prev);
              newSet.delete(index);
              return newSet;
            });
            return;
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to delete file";
          setUploadError(errorMessage);
          onUploadError?.(errorMessage);
          setDeletingFiles((prev) => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
          });
          return;
        }
      }

      // Remove from local state only if server deletion succeeded (or no deleteAction)
      setFiles((prevFiles) => {
        if (!prevFiles) {
          return null;
        }

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

      // Notify parent component of successful deletion
      onDeleteCompleted?.(fileToDelete);

      // Clear deleting state
      setDeletingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    },
    [files, deleteAction, onUploadError, onDeleteCompleted],
  );

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
        <div className="mt-4">
          <div className="mb-2 text-sm font-medium text-gray-700">
            {multiple ? `${files.length} file(s) selected:` : "Selected file:"}
          </div>
          <ul className="space-y-3">
            {files.map((file, index) => {
              const fileName = getFileName(file);
              const isServerFile =
                typeof file === "object" && file !== null && "fid" in file;
              const hasUrl =
                typeof file === "object" && "url" in file && file.url;

              return (
                <li key={index} className="relative">
                  <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md">
                    {/* File type icon */}
                    <div className="flex-shrink-0">
                      {(() => {
                        const isImage =
                          /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fileName);
                        const isPdf = /\.pdf$/i.test(fileName);

                        if (isImage) {
                          return (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                              <svg
                                className="h-5 w-5 text-blue-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          );
                        } else if (isPdf) {
                          return (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                              <svg
                                className="h-5 w-5 text-red-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                              <svg
                                className="h-5 w-5 text-gray-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          );
                        }
                      })()}
                    </div>

                    {/* File details */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {fileName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isServerFile
                          ? "Uploaded"
                          : file instanceof File
                            ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                            : ""}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {/* View button */}
                      {hasUrl && (
                        <a
                          href={(file as any).url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors duration-200 hover:border-blue-300 hover:bg-blue-100"
                          title="View file"
                        >
                          <svg
                            className="mr-1 h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path
                              fillRule="evenodd"
                              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          View
                        </a>
                      )}

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(index)}
                        disabled={deletingFiles.has(index)}
                        className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors duration-200 hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Remove file"
                      >
                        {deletingFiles.has(index) ? (
                          <>
                            <svg
                              className="mr-1 h-4 w-4 animate-spin"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm6 2a2 2 0 100 4 2 2 0 000-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Removing...
                          </>
                        ) : (
                          <>
                            <svg
                              className="mr-1 h-4 w-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"
                                clipRule="evenodd"
                              />
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Remove
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
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
