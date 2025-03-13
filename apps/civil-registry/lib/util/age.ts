export function getAgeByDoB(
  dob: string,
  autoFormat: boolean = false,
): string | null {
  if (!dob) return null;

  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null; // Invalid date check

  const today = new Date();
  let ageYears = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

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
      return `${ageYears} ${ageYears === 1 ? "year" : "years"}`;
    } else {
      return `${ageMonths} ${ageMonths === 1 ? "month" : "months"}`;
    }
  }

  return ageYears.toString();
}
