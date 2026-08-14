export type GuidanceStepKey =
  | 'group-data'
  | 'members'
  | 'loan-conditions'
  | 'proposed-business'
  | 'member-confirmation'
  | 'confirmations'
  | 'review';

export type StepGuidance = {
  key: GuidanceStepKey;
  title: string;
  prepare: string[];
  commonMistakes: string[];
};

export const APPLY_STEP_KEYS: GuidanceStepKey[] = [
  'group-data',
  'members',
  'loan-conditions',
  'proposed-business',
  'member-confirmation',
  'confirmations',
  'review',
];

const GUIDANCE: Record<GuidanceStepKey, Omit<StepGuidance, 'key'>> = {
  'group-data': {
    title: 'Group data',
    prepare: [
      'Have the group registration certificate, members list, and meeting minutes ready.',
      'Confirm county, constituency, ward, and meeting point.',
      'Match the group name and registration number to the certificate.',
    ],
    commonMistakes: [
      'Uploading unclear scans or empty placeholder files.',
      'Selecting the wrong constituency for the group location.',
      'Typing a registration number that does not match the certificate.',
    ],
  },
  members: {
    title: 'Group members',
    prepare: [
      'Collect each member’s National ID and mobile number.',
      'Assign chairperson, secretary, and treasurer correctly.',
      'Use phones that can receive SMS confirmation.',
    ],
    commonMistakes: [
      'Reusing the same phone or National ID within the group.',
      'Wrong mobile digits that block SMS confirmation.',
      'Leaving required officer roles unassigned.',
    ],
  },
  'loan-conditions': {
    title: 'Loan conditions',
    prepare: [
      'Agree the loan amount and repayment period with members.',
      'Confirm the group bank account details if required.',
    ],
    commonMistakes: [
      'Requesting an amount the group cannot justify.',
      'Mismatched repayment period versus group capacity.',
    ],
  },
  'proposed-business': {
    title: 'Proposed business',
    prepare: [
      'Describe the business activities clearly and honestly.',
      'Link activities to the group’s purpose and value chain.',
    ],
    commonMistakes: [
      'Vague or copy-pasted business descriptions.',
      'Activities that do not match the group type.',
    ],
  },
  'member-confirmation': {
    title: 'Member confirmation',
    prepare: [
      'Ensure every member has a valid phone for SMS links.',
      'Brief members before they receive confirmation messages.',
    ],
    commonMistakes: [
      'Sending confirmations before member details are correct.',
      'Using phones members cannot access.',
    ],
  },
  confirmations: {
    title: 'Confirmations',
    prepare: [
      'Track who has confirmed or declined.',
      'Follow up with pending members promptly.',
    ],
    commonMistakes: [
      'Submitting while required confirmations are still pending.',
      'Ignoring declined members without updating the group.',
    ],
  },
  review: {
    title: 'Review & submit',
    prepare: [
      'Review every section for accuracy before submit.',
      'Confirm documents and member details are complete.',
    ],
    commonMistakes: [
      'Submitting with placeholder documents.',
      'Skipping a final check of phone numbers and IDs.',
    ],
  },
};

/** Map a pathname like /apply/APP-1/members to the guidance step key. */
export function guidanceKeyFromPathname(
  pathname: string,
): GuidanceStepKey | null {
  const segments = pathname.split('/').filter(Boolean);
  const applyIdx = segments.indexOf('apply');
  if (applyIdx < 0 || segments.length < applyIdx + 3) {
    return null;
  }
  const step = segments[applyIdx + 2] as GuidanceStepKey;
  if (APPLY_STEP_KEYS.includes(step)) {
    return step;
  }
  return null;
}

export function getStepGuidance(
  key: GuidanceStepKey | null,
): StepGuidance | null {
  if (!key || !(key in GUIDANCE)) {
    return null;
  }
  return { key, ...GUIDANCE[key] };
}
