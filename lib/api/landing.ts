'use server';

import { LandingNodeSchema } from '@/lib/api/schema/node/landing-node.schema';
import { api, validate } from '@/lib/api/utils';
import { getLocale } from 'next-intl/server';

export async function getLanding() {
  const res = await api.GET('/api/v1/resolve', {
    params: {
      header: {
        'X-Language': await getLocale(),
        'X-Path': '/front',
      },
    },
  });

  return validate(res, LandingNodeSchema);
}
