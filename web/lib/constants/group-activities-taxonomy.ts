import type { TaxonomyOption } from '@/lib/api/taxonomy.service';

export const GROUP_ACTIVITIES_CANONICAL_SALON_BARBER =
  'Personalized services(salon, barber)';

const BROKEN_GROUP_ACTIVITY_TERMS = new Set([
  ' barber)',
  'barber)',
  'Personalized services(salon',
]);

export function isBrokenGroupActivityTerm(name: string): boolean {
  const trimmed = name.trim();
  if (
    BROKEN_GROUP_ACTIVITY_TERMS.has(name) ||
    BROKEN_GROUP_ACTIVITY_TERMS.has(trimmed)
  ) {
    return true;
  }

  return /^barber\)?$/i.test(trimmed);
}

export function normalizeGroupActivitySelection(name: string): string {
  if (isBrokenGroupActivityTerm(name)) {
    return GROUP_ACTIVITIES_CANONICAL_SALON_BARBER;
  }
  return name;
}

export function normalizeGroupActivitySelections(names: string[]): string[] {
  const normalized = names.map(normalizeGroupActivitySelection);
  return [...new Set(normalized)];
}

export function sanitizeGroupActivityOptions(
  options: TaxonomyOption[],
): TaxonomyOption[] {
  const seen = new Set<string>();
  const sanitized: TaxonomyOption[] = [];

  for (const option of options) {
    if (
      isBrokenGroupActivityTerm(option.label) ||
      isBrokenGroupActivityTerm(option.value)
    ) {
      if (!seen.has(GROUP_ACTIVITIES_CANONICAL_SALON_BARBER)) {
        sanitized.push({
          label: GROUP_ACTIVITIES_CANONICAL_SALON_BARBER,
          value: GROUP_ACTIVITIES_CANONICAL_SALON_BARBER,
          limitedRole: option.limitedRole,
        });
        seen.add(GROUP_ACTIVITIES_CANONICAL_SALON_BARBER);
      }
      continue;
    }

    if (!seen.has(option.value)) {
      sanitized.push(option);
      seen.add(option.value);
    }
  }

  return sanitized;
}
