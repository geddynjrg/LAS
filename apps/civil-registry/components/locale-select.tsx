"use client";

import type { FC } from "react";

import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Flag } from "@workspace/ui/components/flag";

import { locales, type Locale } from "@/i18n/config";
import { setUserLocale } from "@/lib/locale";

export interface LocaleSelectProps {
  defaultValue: Locale;
}

export const LocaleSelect: FC<LocaleSelectProps> = ({ defaultValue }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="md">
          <Icon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup
          value={defaultValue}
          onValueChange={(value) => setUserLocale(value as Locale)}
        >
          {locales.map((locale) => (
            <DropdownMenuRadioItem
              key={locale.value}
              value={locale.value}
              className="flex items-center gap-2"
            >
              <Flag code={locale.value} />
              {locale.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Icon: FC = () => {
  return (
    <svg
      className="text-blue-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 25 25"
    >
      <path
        fill="currentColor"
        d="M22 12.5c0-5.52-4.48-10-10-10S2 6.98 2 12.5s4.48 10 10 10l10-10Z"
      ></path>
      <path
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M9.5 2.5c-1.95 5.84-1.95 14.16 0 20m5.5-20c.97 2.92 1.46 6.96 1.46 10"
      ></path>
      <path
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M2 15c2.92.97 6.96 1.96 10 1.96M2 9.498c5.84-1.95 14.16-1.446 20 .503"
      ></path>
      <path
        fill="currentColor"
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.5 24a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z"
      ></path>
      <path
        fill="#fff"
        d="m14 21 3.28-8h1.465L22 21h-1.622l-1.801-4.549a8.052 8.052 0 0 1-.169-.434 28.145 28.145 0 0 0-.216-.64 47.34 47.34 0 0 1-.36-1.097l.3-.011a52.643 52.643 0 0 1-.372 1.109c-.072.205-.144.403-.216.593-.064.19-.125.362-.18.515L15.561 21H14Zm1.49-1.829.54-1.291h3.832l.576 1.291H15.49Z"
      ></path>
    </svg>
  );
};
