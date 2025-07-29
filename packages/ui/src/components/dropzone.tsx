"use client";

import { IconBan, IconFileCheck, IconPaperclip } from "@tabler/icons-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type FC,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { useFormStatus } from "react-dom";
import {
  FileRejection,
  FileWithPath,
  useDropzone,
  type DropzoneOptions,
  type DropzoneState,
} from "react-dropzone";

import mergeRefs, { cn, cva } from "@workspace/ui/lib/utils";

export type DropzoneContextProps = DropzoneState &
  DropzoneOptions & { ref?: RefObject<HTMLInputElement> };

const DropzoneContext = createContext<DropzoneContextProps>(
  {} as DropzoneContextProps,
);

export const useDropzoneContext = () => useContext(DropzoneContext);

export interface DropzoneProps extends DropzoneOptions {
  children?: ReactNode;
}

export const Dropzone: FC<DropzoneProps> = ({
  multiple = false,
  children,
  ...props
}) => {
  const state = useDropzone(props);

  return (
    <DropzoneContext.Provider value={{ ...state, ...props, multiple }}>
      {children}
    </DropzoneContext.Provider>
  );
};

export const dropzoneVariants = cva({
  base: [
    "border-border bg-background focus-visible-ring min-h-16 cursor-pointer rounded border-2 border-dotted p-2 transition-colors hover:border-neutral-700",
    "data-[drag-reject]:border-destructive data-[drag-reject]:bg-destructive/30 data-[drag-reject]:cursor-no-drop",
    "data-[disabled]:cursor-not-allowed data-[no-click]:cursor-default data-[disabled]:border-inherit data-[disabled]:bg-inherit data-[disabled]:opacity-50",
    "data-[drag-active]:bg-neutral-200",
  ],
});

export const DropzoneZone: FC<{
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  onMouseDown?: (e: MouseEvent<HTMLDivElement>) => void;
  className?: string;
  children?: ReactNode;
}> = ({ className, children, ...props }) => {
  const {
    getRootProps,
    isFocused,
    isDragActive,
    isDragAccept,
    isDragReject,
    isFileDialogActive,
    preventDropOnDocument,
    noClick,
    noKeyboard,
    noDrag,
    noDragEventsBubbling,
    disabled,
  } = useDropzoneContext();

  return (
    <div
      data-prevent-drop-on-document={preventDropOnDocument ? true : undefined}
      data-no-click={noClick ? true : undefined}
      data-no-keyboard={noKeyboard ? true : undefined}
      data-no-drag={noDrag ? true : undefined}
      data-no-drag-events-bubbling={noDragEventsBubbling ? true : undefined}
      data-disabled={disabled ? true : undefined}
      data-focused={isFocused ? true : undefined}
      data-drag-active={isDragActive ? true : undefined}
      data-drag-accept={isDragAccept ? true : undefined}
      data-drag-reject={isDragReject ? true : undefined}
      data-file-dialog-active={isFileDialogActive ? true : undefined}
      className={cn(dropzoneVariants(), className)}
      {...getRootProps(props)}
    >
      {children}
    </div>
  );
};

export interface DropzoneDragAcceptedProps {
  children?: ReactNode;
}

export const DropzoneDragAccepted: FC<DropzoneDragAcceptedProps> = ({
  children,
}) => {
  const { isDragAccept } = useDropzoneContext();

  if (!isDragAccept) {
    return null;
  }

  return children;
};

export interface DropzoneDragRejectedProps {
  children?: ReactNode;
}

export const DropzoneDragRejected: FC<DropzoneDragRejectedProps> = ({
  children,
}) => {
  const { isDragReject } = useDropzoneContext();

  if (!isDragReject) {
    return null;
  }

  return children;
};

export interface DropzoneDragDefaultProps {
  children?: ReactNode;
}

export const DropzoneDragDefault: FC<DropzoneDragDefaultProps> = ({
  children,
}) => {
  const { isDragActive, fileRejections } = useDropzoneContext();

  if (isDragActive || fileRejections.length > 0) {
    return null;
  }

  return children;
};

export interface DropzoneAcceptedProps {
  children: (acceptedFiles: Readonly<FileWithPath[]>) => ReactNode;
}

export const DropzoneAccepted: FC<DropzoneAcceptedProps> = ({ children }) => {
  const { acceptedFiles } = useDropzoneContext();

  return children(acceptedFiles);
};

export interface DropzoneRejectedProps {
  children: (fileRejections: Readonly<FileRejection[]>) => ReactNode;
}

export const DropzoneRejected: FC<DropzoneRejectedProps> = ({ children }) => {
  const { fileRejections } = useDropzoneContext();

  return children(fileRejections);
};

export interface DropzoneUploadIconProps {
  className?: string;
  children?: ReactNode;
}

export const DropzoneUploadIcon: FC<DropzoneUploadIconProps> = ({
  className,
  children,
  ...props
}) => (
  <>
    <DropzoneDragAccepted>
      <IconFileCheck
        className={cn("size-5 text-neutral-500", className)}
        {...props}
      />
      {children}
    </DropzoneDragAccepted>
    <DropzoneDragRejected>
      <IconBan className={cn("size-5 text-red-600", className)} {...props} />
      {children}
    </DropzoneDragRejected>
    <DropzoneDragDefault>
      <IconPaperclip
        className={cn("size-5 text-neutral-500", className)}
        {...props}
      />
      {children}
    </DropzoneDragDefault>
  </>
);

export const DropzoneInput: FC<{
  name?: string;
  capture?: boolean | "user" | "environment";
  value?: File[] | null;
  className?: string;
}> = ({ name, className, value, ...props }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const { getInputProps, disabled } = useDropzoneContext();
  const inputProps = getInputProps({ disabled, name, ...props });

  const updateFileInputValue = useCallback((files: File[] | null) => {
    if (!inputRef.current) {
      return;
    }

    inputRef.current.files = createFileList(files);
  }, []);

  // Update file input value when value prop changes
  useEffect(() => {
    if (value === undefined) {
      return;
    }

    updateFileInputValue(value);
  }, [updateFileInputValue, value]);

  // File input resets itself when form is submitted.
  // This is a workaround for keeping the file input value
  useWasSubmitted(() => {
    if (value === undefined) {
      return;
    }
    updateFileInputValue(value);
  });

  return (
    <input
      {...inputProps}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={mergeRefs(inputRef, (inputProps as any)?.ref)}
      className={className}
    />
  );
};

/**
 * A hook that runs a callback function when the form is submitted.
 */
function useWasSubmitted(cb: () => void) {
  const { pending } = useFormStatus();
  const prevPending = useRef(pending);

  useEffect(() => {
    if (prevPending && !pending) {
      cb();
    }
  }, [pending, prevPending, cb]);
}

/**
 * Creates a FileList from an array of File objects.
 * This is useful for setting the files property of an input element.
 * @see https://stackoverflow.com/a/68182158/1068446
 */
function createFileList(files: File[] | null | undefined) {
  const dataTransfer = new DataTransfer();
  files?.forEach((file) => dataTransfer.items.add(file));

  return dataTransfer.files;
}
