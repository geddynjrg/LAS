"use client";

import { IconCamera } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useState, type FC } from "react";
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

type ServerFile = { id: string; name: string; type: string; url: string };

export type FileUploadInputValue = File | ServerFile | string;

export interface FileUploadInputProps {
  accept: Accept;
  maxSize: number;
  name?: string;
  // multiple?: boolean;
  disabled?: boolean;
  defaultValue?: FileUploadInputValue;
  attachmentBgInverted?: boolean;
}

export const FileUploadInput: FC<FileUploadInputProps> = ({
  accept,
  maxSize,
  name,
  // multiple,
  disabled,
  defaultValue,
  attachmentBgInverted = false,
}) => {
  const multiple = false;

  const t = useTranslations("FileUploadInput");

  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const [files, setFiles] = useState<FileUploadInputValue[] | null>(
    defaultValue ? [defaultValue] : null,
  );

  const hasImageType = "image/*" in accept;

  const serverFile = files?.find(
    (file) => !(file instanceof File) && typeof file === "object",
  ) as ServerFile | undefined;

  // "capture" prop works only for image/* MIME type. Exclude other MIME types when picture button is pressed.
  const acceptWithCamera =
    isCameraEnabled && hasImageType
      ? ({ "image/*": accept["image/*"] } as Accept)
      : accept;

  function handleDelete(index: number) {
    setFiles((prevFiles) => {
      if (!prevFiles) {
        return null;
      }

      const newFiles = [...prevFiles];
      newFiles.splice(index, 1);

      return newFiles.length ? newFiles : null;
    });
  }

  function handleReset() {
    setFiles(null);
    setResetCount((prev) => prev + 1);
  }

  return (
    <Dropzone
      key={resetCount}
      accept={acceptWithCamera}
      multiple={multiple}
      maxSize={maxSize}
      disabled={disabled}
      onDrop={setFiles}
    >
      <DropzoneInput
        name={
          serverFile || !files?.length
            ? undefined
            : name /* prevent submitting empty files to formData */
        }
        capture={hasImageType && isCameraEnabled}
        value={files === null ? null : files?.filter(isValidFile)}
      />

      {serverFile && (
        <>
          <input type="hidden" name={`${name}.id`} value={serverFile.id} />
          <input type="hidden" name={`${name}.name`} value={serverFile.name} />
          <input type="hidden" name={`${name}.type`} value={serverFile.type} />
          <input type="hidden" name={`${name}.url`} value={serverFile.url} />
        </>
      )}

      <div className="flex items-center justify-center gap-4">
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

            <span className="[.device-type-desktop_&]:hidden">{t("or")}</span>
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
      </div>

      {files && (
        <ul className="mt-4 space-y-2">
          {files.map((file, index) => (
            <Attachment
              key={index}
              className={cn(
                "shadow",
                attachmentBgInverted && "bg-site-background",
              )}
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
    return file.name;
  }

  return "";
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
  if (file instanceof File) {
    // check if file actually exists, assigning zero byte files to file input can crash browser
    return file.size > 0;
  }

  return false;
}
