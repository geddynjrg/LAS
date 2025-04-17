"use client";

import { IconCaretDownFilled } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { type FC } from "react";

import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { Field } from "@workspace/ui/components/form";
import { SearchInput } from "@workspace/ui/components/search-input";
import { useForm } from "@workspace/ui/hooks/use-form";

import { fatherAction } from "@/app/add/father/father-action";
import {
  fatherSchema,
  type FatherSchema,
} from "@/app/add/father/father-schema";
import { FormWrap } from "@/app/add/form-wrap";
import { ContactFields } from "@/components/contact-fields";
import { NationalIdFields } from "@/components/national-id-fields";
import { educationOptions } from "@/lib/data/dummy-data";
import type { Person } from "@/lib/data/person";

export interface FatherFormProps {
  id: string;
  defaultValues?: Partial<
    FatherSchema & { father?: string | Person; mother?: string | Person }
  >;
}

export const FatherForm: FC<FatherFormProps> = ({ id, defaultValues }) => {
  const t = useTranslations();
  const [state, formAction, isPending] = useForm(
    fatherAction,
    fatherSchema,
    defaultValues,
  );

  return (
    <FormWrap
      action={formAction}
      isPending={isPending}
      prevUrl="/add/mother"
      className="space-y-4"
    >
      <input type="hidden" name="id" value={id} />

      <DataBlock
        title={t(`DetailsPage.title-father`)}
        disabled={undefined}
        active={undefined}
        toggleEdit={undefined}
      >
        <NationalIdFields searchSexFilter="M" state={state} />

        <Field
          state={state}
          name="education"
          label={t("DetailsPage.education")}
          control={(props) => (
            <SearchInput
              {...props}
              options={educationOptions}
              placeholder={t("FormPlaceholders.select")}
              endDecorator={<IconCaretDownFilled />}
            />
          )}
          required={false}
        />

        <ContactFields state={state} />
      </DataBlock>
    </FormWrap>
  );
};
