import { PhoneNumberUtil } from "google-libphonenumber";

const phoneUtil = PhoneNumberUtil.getInstance();

/**
 * Returns calling code and phone number from a phone string.
 */
export function parsePhoneNumber(phone: string) {
  try {
    const number = phoneUtil.parseAndKeepRawInput(phone);

    return {
      callingCode: number.getCountryCode()?.toString() || "",
      phone: number.getNationalNumber()?.toString() || "",
    };
  } catch (error) {
    console.warn("Error parsing phone number with region code:", error);
    return {
      callingCode: "",
      phone,
    };
  }
}

/**
 * Combines calling code and phone number into a single string.
 */
export function formatPhoneNumber(args: {
  callingCode: string;
  phone: string;
}) {
  const phoneNumber = `${args.callingCode}${args.phone}`;

  if (phoneNumber.startsWith("+")) {
    return phoneNumber;
  }

  if (!args.callingCode) {
    return phoneNumber;
  }

  return `+${phoneNumber}`;
}
