import { IconCheck, IconEdit, IconX } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export interface DataBlockProps {
  children: ReactNode;
  title: string;
  description?: string;
  disabled?: boolean;
  active?: boolean;
  toggleEdit?: () => void;
}

export const DataBlock: FC<DataBlockProps> = ({
  children,
  title,
  description,
  disabled,
  active,
  toggleEdit,
}) => {
  const t = useTranslations();
  return (
    <div className={cn(disabled && "text-neutral-600")}>
      <div className={cn("flex items-center justify-between gap-4")}>
        <h3 className={cn("typo-h3")}>{title}</h3>
        {active !== undefined && active !== true && (
          <Button
            asChild
            onClick={toggleEdit}
            variant="secondary"
            className={cn(
              disabled && "border-neutral-400 bg-neutral-100 text-neutral-400",
            )}
          >
            <Link
              href="#amend"
              className={cn("!px-5")}
              onClick={(e) => e.preventDefault()}
            >
              {t("Buttons.amend")} <IconEdit />
            </Link>
          </Button>
        )}
      </div>

      {description && <p className={cn("mt-1")}>{description}</p>}

      <div
        className={cn(
          "mt-3 space-y-4 border-t border-solid border-neutral-400 pt-3",
        )}
      >
        {children}
      </div>

      {active && (
        <div
          className={cn(
            "mt-3 border-t border-solid border-neutral-400 pt-3",
            "flex justify-between gap-3",
          )}
        >
          <Button variant="secondary" onClick={toggleEdit}>
            Cancel <IconX />
          </Button>
          <Button type="submit">
            Confirm <IconCheck />
          </Button>
        </div>
      )}
    </div>
  );
};
