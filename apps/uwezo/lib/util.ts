import { customAlphabet } from "nanoid";

export const createApplicationId = () => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const nanoid = customAlphabet(alphabet, 6);

  const uniqueId = `FRE-${nanoid()}`;

  return uniqueId;
};

export const parseNumber = (value: string) => {
  const num = Number(value);

  return Number.isFinite(num) ? num : 0;
};
