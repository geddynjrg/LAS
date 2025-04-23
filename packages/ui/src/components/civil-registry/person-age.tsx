import { useTranslations } from "next-intl";
import type { FC, ReactNode } from "react";

export interface PersonAgeProps {
  dob?: string;
  autoFormat?: boolean;
  children?: ReactNode;
}

export const PersonAge: FC<PersonAgeProps> = ({ dob, autoFormat }) => {
  const t = useTranslations("PersonCard");

  if (!dob) {
    return "N/A";
  }

  const birthDate = new Date(dob);
  // Invalid date check
  if (isNaN(birthDate.getTime())) {
    return "N/A";
  }

  const today = new Date();
  let ageYears = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  // in cases birth date is in future
  if (today < birthDate) {
    return "N/A";
  }

  // Adjust if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    ageYears--;
  }

  let ageMonths =
    (today.getFullYear() - birthDate.getFullYear()) * 12 +
    today.getMonth() -
    birthDate.getMonth();
  if (dayDiff < 0) {
    ageMonths--;
  }

  if (autoFormat) {
    if (ageYears > 0) {
      return t("ageYears", { count: ageYears });
    } else {
      return t("ageMonths", { count: ageMonths });
    }
  }

  return ageYears.toString();
};
