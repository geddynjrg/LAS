/**
 * Capitalizes the first letter of each word in a string
 * Handles special cases like hyphens, apostrophes, and multiple spaces
 * @param text - The text to capitalize
 * @returns The text with each word's first letter capitalized
 */
export function capitalizeWords(text: string): string {
  if (!text || typeof text !== 'string') return text;

  return text
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/'\w/g, (match) => match.toUpperCase());
}

