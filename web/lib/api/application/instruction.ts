import { ApplicationInstructionsResponseSchema } from '@/lib/api/schema/application/instruction.schema';
import { api, validate } from '@/lib/api/utils';
import { getLocale } from 'next-intl/server';

export async function getApplicationInstructions() {
  const res = await api.GET('/api/v1/application/instructions', {
    params: {
      header: {
        'X-Language': await getLocale(),
      },
    },
  });

  return validate(res, ApplicationInstructionsResponseSchema);
}
