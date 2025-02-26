import { IconArrowRight } from "@tabler/icons-react";
import { cva, type VariantProps } from "cva-extended";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { Tag } from "@workspace/ui/components/tag";
import { cn } from "@workspace/ui/lib/utils";

export const applyCardVariants = cva({
  base: "typo-body-small flex grow flex-col gap-2 rounded-e-md p-4",
  variants: {
    variant: {
      primary: "border-l-16",
      secondary: "border-0",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

export interface ApplyCardProps extends VariantProps<typeof applyCardVariants> {
  tags: string[];
  className?: string;
  title: string;
  fee: string;
  school?: string;
  applyByDate: string;
  startsOnDate?: string;
  borderColor?: string;
  href: string;
}

export const ApplyCard: FC<ApplyCardProps> = ({
  variant,
  className,
  title,
  fee,
  tags,
  school,
  applyByDate,
  startsOnDate,
  borderColor,
  href,
}) => {
  const t = useTranslations("ApplyCard");

  return (
    <div className="border-theme-200 flex w-full flex-row overflow-clip rounded-md border-2 bg-neutral-200 shadow-md">
      <div
        className={cn(applyCardVariants({ variant, className }))}
        style={{ borderColor: borderColor }}
      >
        <div className="flex gap-2">
          {tags.map((tag, index) => (
            <Tag key={index}>{tag}</Tag>
          ))}
        </div>
        <h2 className="typo-h4 h-full">{title}</h2>
        <div className="flex justify-between">
          <p className="typo-h6 font-normal">
            {t("fee")}: <span className="font-bold">{fee}</span>
          </p>
          {variant == "secondary" ? (
            <p>
              {t("applyBy")} <strong>{applyByDate}</strong>
            </p>
          ) : null}
        </div>

        {variant != "secondary" ? (
          <div>
            <hr className="bg-theme-200 mt-0" />
            <p>{school}</p>
            <div className="flex justify-between">
              <p>
                {t("applyBy")}
                <strong>{applyByDate}</strong>
              </p>
              <p>
                {t("startsOn")} <strong>{startsOnDate}</strong>
              </p>
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex flex-col items-center justify-center p-4">
        <Button asChild variant="shadow">
          <Link href={href}>
            <IconArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
};
