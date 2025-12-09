'use server';

import { SiteInformationResponseSchema } from '@/lib/api/schema/site-info/site-info.schema';
import { api, validate } from '@/lib/api/utils';
import { getLocale } from 'next-intl/server';

export async function getSiteInfo() {
  const res = await api.GET('/api/v1/site-info', {
    params: {
      header: {
        'X-Language': await getLocale(),
      },
    },
  });

  return validate(res, SiteInformationResponseSchema);
}
