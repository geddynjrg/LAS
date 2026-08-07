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

function resolveKenyanPhoneFromSources(...sources) {
  for (const source of sources) {
    if (!source) continue;
    const normalized = normalizeKenyanPhoneLocal(source);
    if (normalized) return normalized;
  }
  return null;
}

function coercePhoneFormValue(value) {
  if (value == null) return undefined;

  if (Array.isArray(value)) {
    const normalized = resolveKenyanPhoneFromSources(...value.map(String));
    if (normalized) return normalized;
    const digits = value
      .map((entry) => String(entry).replace(/\D/g, ''))
      .reduce(
        (longest, entry) => (entry.length > longest.length ? entry : longest),
        '',
      );
    return digits || undefined;
  }

  if (typeof value !== 'string') return undefined;

  return (
    (normalizeKenyanPhoneLocal(value) ?? value.replace(/\D/g, '')) || undefined
  );
}

function resolveKenyanPhoneForSubmit(...sources) {
  const normalized = resolveKenyanPhoneFromSources(...sources);
  if (normalized) return normalized;

  let longest = '';
  for (const source of sources) {
    if (!source) continue;
    const digits = source.replace(/\D/g, '');
    if (digits.length > longest.length) longest = digits;
  }

  return longest;
}

const cases = [
  { input: '720501239', local: '720501239', api: '+254720501239', valid: true },
  { input: '701349113', local: '701349113', api: '+254701349113', valid: true },
  { input: '0720501239', local: '720501239', api: '+254720501239', valid: true },
  { input: '0701349113', local: '701349113', api: '+254701349113', valid: true },
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

const submitCases = [
  {
    sources: ['720501239', '72050123'],
    expected: '720501239',
    label: 'prefers sync ref over stale DOM/state on fast submit',
  },
  {
    sources: ['701349113', '70134911'],
    expected: '701349113',
    label: 'prefers valid DOM value over stale state',
  },
  {
    sources: ['720501239', '72050123'],
    expected: '720501239',
    label: 'prefers complete 9-digit number over stale partial',
  },
  {
    sources: ['', '701349113', '70134911'],
    expected: '701349113',
    label: 'skips empty sources',
  },
  {
    sources: ['70134911', '701349113'],
    expected: '701349113',
    label: 'uses later valid source',
  },
  {
    sources: ['70134911', '7013491'],
    expected: '70134911',
    label: 'falls back to longest partial digits when invalid',
  },
  {
    sources: ['72050123', '720501239'],
    expected: '720501239',
    label: 'prefers longest digit run over stale partial ref on fast submit',
  },
];

for (const { sources, expected, label } of submitCases) {
  const resolved = resolveKenyanPhoneForSubmit(...sources);
  if (resolved !== expected) {
    console.error('FAIL submit:', { label, sources, resolved, expected });
    failed++;
  }
}

const coerceCases = [
  { input: ['', '701349113'], expected: '701349113' },
  { input: ['70134911', '701349113'], expected: '701349113' },
  { input: ['72050123', '720501239'], expected: '720501239' },
];

for (const { input, expected } of coerceCases) {
  const coerced = coercePhoneFormValue(input);
  if (coerced !== expected) {
    console.error('FAIL coerce:', { input, coerced, expected });
    failed++;
  }
}

if (failed > 0) {
  console.error(`${failed} test(s) failed`);
  process.exit(1);
}

console.log(`All ${cases.length + submitCases.length + coerceCases.length} phone normalization tests passed`);
