'use server';

import {
  type Member,
  memberSchema,
} from '@/app/apply/[id]/members/member-schema';
import type { FormAction } from '@workspace/ui/hooks/use-form';
import { getFormZodDataValues } from '@workspace/ui/lib/utils';

export const memberAction: FormAction<Member> = async (_prev, formData) => {
  const values = getFormZodDataValues(formData, memberSchema);

  const { success, error } = memberSchema.safeParse(values);

  if (error) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  return { values };
};
