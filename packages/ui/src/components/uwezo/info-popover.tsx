"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  IconHelpCircle,
  IconHelpOctagon,
  IconMail,
  IconX,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";

import { Button } from "@workspace/ui/components/button";
import { Popover, PopoverTrigger } from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";

export const InfoPopoverRoot = PopoverPrimitive.Root;
export const InfoPopoverTrigger = PopoverPrimitive.Trigger;
export const InfoPopoverClose = PopoverPrimitive.Close;

export interface InfoPopoverProps {
  floating?: boolean;
  className?: string;
}

export const InfoPopover: FC<InfoPopoverProps> = ({
  floating = "true",
  className,
}) => {
  const t = useTranslations("InfoPopover");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          style={{ flexGrow: 0 }}
          className={cn(
            "z-20 h-[2.5rem] rounded-br-none rounded-tr-none pl-6 pr-3",
            floating && "fixed right-0 top-[9.6875rem]",
          )}
          aria-label={t("help")}
        >
          {t("help")}
          <IconHelpCircle />
        </Button>
      </PopoverTrigger>

      <PopoverPrimitive.Content
        align="end"
        side="bottom"
        className={cn(
          "z-50 -translate-y-[2.5rem]",
          "rounded-l-md border-b border-l border-t border-solid border-neutral-400 pb-4 pl-6 pr-3 pt-1 shadow-[0px_1px_5px_0px_rgba(0,0,0,0.2)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
          "bg-background text-popover-foreground",
          className,
        )}
      >
        <PopoverPrimitive.Close asChild>
          <Button
            variant="ghost"
            size="md"
            className={cn(
              "flex gap-1",
              "mb-1 ml-auto px-0",
              "text-neutral-700",
              "active:bg-transparent",
            )}
          >
            {t("close")}
            <IconX className="text-color-foreground" />
          </Button>
        </PopoverPrimitive.Close>

        <h5 className={cn("typo-h5", "mb-2")}>{t("title")}</h5>

        <ul className={cn("text-primary", "space-y-3")}>
          <li>
            <a className={cn("text-inherit underline", "flex gap-1")} href="#">
              <IconHelpOctagon /> {t("faq")}
            </a>
          </li>

          <li>
            <a
              className={cn("text-inherit underline", "flex gap-1")}
              href="tel:0000000000"
            >
              <IconPhone className={cn("ml-[0.125rem]")} />
              +254 000 000000
            </a>
          </li>

          <li>
            <a
              className={cn("text-inherit underline", "flex gap-1")}
              href="mailto:email@email.com"
            >
              <IconMail />
              email@email.com
            </a>
          </li>
        </ul>
      </PopoverPrimitive.Content>
    </Popover>
  );
};

const IconPhone: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width={20} height={20.01} viewBox="0 0 20.01 20">
    <path
      d="M7,7.98c0,.13.05.26.15.35.09.09.22.15.35.15s.26-.05.35-.15c.09-.09.15-.22.15-.35v-1c0-.13-.05-.26-.15-.35-.09-.09-.22-.15-.35-.15s-.26.05-.35.15c-.09.09-.15.22-.15.35v1ZM7,7.98c0,1.33.53,2.6,1.46,3.54.94.94,2.21,1.46,3.54,1.46M12,12.98h1c.13,0,.26-.05.35-.15.09-.09.15-.22.15-.35s-.05-.26-.15-.35c-.09-.09-.22-.15-.35-.15h-1c-.13,0-.26.05-.35.15-.09.09-.15.22-.15.35s.05.26.15.35c.09.09.22.15.35.15ZM1,18.98l1.65-3.8c-1.26-1.79-1.83-3.98-1.59-6.16.24-2.18,1.26-4.2,2.88-5.67,1.62-1.48,3.72-2.31,5.91-2.35,2.19-.04,4.32.73,5.99,2.15,1.67,1.42,2.76,3.4,3.07,5.57.31,2.17-.18,4.38-1.39,6.21-1.2,1.83-3.03,3.16-5.15,3.74-2.11.58-4.37.37-6.34-.6l-5.05.9Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);
