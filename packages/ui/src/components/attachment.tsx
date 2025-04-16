import { IconExclamationCircleFilled, IconX } from "@tabler/icons-react";
import type { FC, MouseEvent, ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export interface AttachmentProps {
  error?: string;
  url?: string;
  onDelete?: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  children?: ReactNode;
}

export const Attachment: FC<AttachmentProps> = ({
  error,
  url,
  onDelete,
  className,
  children,
}) => {
  return (
    <>
      <div
        className={cn(
          "bg-background flex min-h-11 items-center justify-between rounded-sm",
          error && "border-destructive border",
          className,
        )}
      >
        <div className="flex items-center gap-2 px-2">
          {error && (
            <IconExclamationCircleFilled className="text-destructive" />
          )}
          {url && !url.startsWith("blob") ? (
            <a href={url} target="_blank" rel="noreferrer">
              {children}
            </a>
          ) : (
            <div>{children}</div>
          )}
        </div>

        {onDelete && (
          <Button type="button" onClick={onDelete} variant="ghost">
            <IconX />
          </Button>
        )}
      </div>
      {error && (
        <div className="text-destructive typo-body-small mt-2">{error}</div>
      )}
    </>
  );
};
