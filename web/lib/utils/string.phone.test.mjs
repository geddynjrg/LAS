/**
 * Phone normalization tests (run: node lib/utils/string.phone.test.mjs)
 * Imports compiled logic inline to avoid TS build step in CI-less runs.
 */

const KENYA_LOCAL_PHONE_REGEX = /^[17]\d{8}$/;

function normalizeKenyanPhoneLocal(phone) {
  if (!phone) return null;

  let digits = phone.replace(/\D/g, '');

  if (digits.startsWith('254') && digits.length === 12) {
    digits = digits.slice(3);
  } else if (digits.startsWith('0') && digits.length === 10) {
    digits = digits.slice(1);
  }

  if (!KENYA_LOCAL_PHONE_REGEX.test(digits)) {
    return null;
  }

  return digits;
}

function isValidKenyanPhoneNumber(phone) {
  return normalizeKenyanPhoneLocal(phone) !== null;
}

function formatKenyanPhoneForApi(phone) {
  const local = normalizeKenyanPhoneLocal(phone);
  return local ? `+254${local}` : null;
}

const cases = [
  { input: '720501239', local: '720501239', api: '+254720501239', valid: true },
  { input: '0720501239', local: '720501239', api: '+254720501239', valid: true },
  { input: '254720501239', local: '720501239', api: '+254720501239', valid: true },
  { input: '+254720501239', local: '720501239', api: '+254720501239', valid: true },
  { input: '+254 720 501 239', local: '720501239', api: '+254720501239', valid: true },
  { input: '712345678', local: '712345678', api: '+254712345678', valid: true },
  { input: '234567890', local: null, api: null, valid: false },
  { input: '72050123', local: null, api: null, valid: false },
  { input: '', local: null, api: null, valid: false },
];

let failed = 0;

for (const { input, local, api, valid } of cases) {
  const normalized = normalizeKenyanPhoneLocal(input);
  const isValid = isValidKenyanPhoneNumber(input);
  const formatted = formatKenyanPhoneForApi(input);

  if (normalized !== local || isValid !== valid || formatted !== api) {
    console.error('FAIL:', { input, normalized, local, isValid, valid, formatted, api });
    failed++;
  }
}

if (failed > 0) {
  console.error(`${failed} test(s) failed`);
  process.exit(1);
}

console.log(`All ${cases.length} phone normalization tests passed`);
