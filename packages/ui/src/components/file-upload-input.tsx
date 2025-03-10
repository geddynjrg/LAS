"use client";

import { IconCamera } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useState, type FC } from "react";
import type { Accept, ErrorCode, FileError } from "react-dropzone";

import { Attachment } from "@workspace/ui/components/attachment";
import {
  Dropzone,
  DropzoneAccepted,
  DropzoneDragAccepted,
  DropzoneDragDefault,
  DropzoneDragRejected,
  DropzoneInput,
  DropzoneRejected,
  DropzoneUploadIcon,
  DropzoneZone,
} from "@workspace/ui/components/dropzone";

export interface FileUploadInputProps {
  accept: Accept;
  maxSize: number;
  name?: string;
  multiple?: boolean;
  disabled?: boolean;
}

export const FileUploadInput: FC<FileUploadInputProps> = ({
  accept,
  maxSize,
  name,
  multiple,
  disabled,
}) => {
  const t = useTranslations("FileUploadInput");

  const [isCameraEnabled, setIsCameraEnabled] = useState(false);

  const hasImageType = "image/*" in accept;

  // "capture" prop works only for image/* MIME type. Exclude other MIME types when picture button is pressed.
  const acceptWithCamera =
    isCameraEnabled && hasImageType
      ? ({ "image/*": accept["image/*"] } as Accept)
      : accept;

  return (
    <Dropzone
      accept={acceptWithCamera}
      multiple={multiple}
      maxSize={maxSize}
      disabled={disabled}
    >
      <DropzoneInput name={name} capture={hasImageType} />

      <div className="flex items-center justify-center gap-4">
        {hasImageType && (
          <>
            {/* picture */}
            <DropzoneZone
              onMouseDown={() => setIsCameraEnabled(true)}
              className="flex flex-1 items-center justify-center gap-2"
            >
              <IconCamera className="size-5 text-neutral-500" />
              {t("takePicture")}
            </DropzoneZone>

            <span>{t("or")}</span>
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

      <DropzoneAccepted>
        {(files) => (
          <ul className="mt-4 space-y-2">
            {files.map(
              (file) =>
                !!files.length && (
                  <Attachment key={file.path} className="shadow">
                    {file.path}
                  </Attachment>
                ),
            )}
          </ul>
        )}
      </DropzoneAccepted>

      <DropzoneRejected>
        {(files) =>
          !!files.length && (
            <ul className="mt-4 space-y-2">
              {files.map((file) => (
                <Attachment
                  key={file.file.name}
                  className="shadow"
                  error={getTranslatedError(file.errors, t)}
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

function getTranslatedError(
  errors: readonly FileError[],
  t: ReturnType<typeof useTranslations>,
) {
  return errors
    .map((error) => t(`errors.${error.code as ErrorCode}`))
    .join(", ");
}
