import { customAlphabet } from "nanoid";

export const createApplicationId = () => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const nanoid = customAlphabet(alphabet, 6);
  // Get the current date in the format YYYYMMDD
  const date = new Date().toISOString().split("T")[0]!.replace(/-/g, "");

  const uniqueId = `APP-${date}-${nanoid()}`;

  return uniqueId;
};

export const parseNumber = (value: string) => {
  const num = Number(value);

  return Number.isFinite(num) ? num : 0;
};
