import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export * from "cva-extended";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function assertNever(value: never): never {
  throw new Error(
    `Unhandled discriminated union member: ${JSON.stringify(value)}`,
  );
}
