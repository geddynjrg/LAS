export type FieldGuidanceKey =
  | 'phone'
  | 'nationalId'
  | 'groupName'
  | 'registrationNumber'
  | 'groupRegistrationCertificate';

export const FIELD_GUIDANCE_TIPS: Record<FieldGuidanceKey, string> = {
  phone: 'Use a valid Kenyan mobile number the member can receive SMS on.',
  nationalId: 'Enter digits exactly as on the National ID / Alien ID card.',
  groupName: 'Match the group name on the registration certificate exactly.',
  registrationNumber:
    'Copy the registration number from the group registration certificate.',
  groupRegistrationCertificate:
    'Upload a clear scan or photo of the official group registration certificate.',
};

export function tipForField(key: FieldGuidanceKey): string {
  return FIELD_GUIDANCE_TIPS[key];
}
