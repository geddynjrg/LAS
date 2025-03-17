import { customAlphabet } from "@workspace/ui/components/nanoid";

export const createApplicationId = () => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const nanoid = customAlphabet(alphabet, 6);

  const uniqueId = `FRE-${nanoid()}`;

  return uniqueId;
};
