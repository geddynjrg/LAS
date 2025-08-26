import { TaxonomyVocabulariesResponseSchema } from '@/lib/api/schema/application/taxonomy-vocabularies.schema';
import { api, validate } from '@/lib/api/utils';
import { getLocale } from 'next-intl/server';

export async function getTaxonomyVocabularies() {
  const res = await api.GET('/api/v1/application/taxonomy-vocabularies', {
    params: {
      header: {
        'X-Language': await getLocale(),
      },
    },
  });

  return validate(res, TaxonomyVocabulariesResponseSchema);
}
