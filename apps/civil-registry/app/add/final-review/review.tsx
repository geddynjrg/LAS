import { useTranslations } from "next-intl";
import { type FC } from "react";

import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";

import { FinalChildForm } from "@/app/add/final-review/final-child-form";
import { FinalFatherForm } from "@/app/add/final-review/final-father-form";
import { FinalInformantForm } from "@/app/add/final-review/final-informant-form";
import { FinalMotherForm } from "@/app/add/final-review/final-mother-form";
import { FormWrap } from "@/app/add/form-wrap";
import type { Person } from "@/lib/data/person";

export interface ReviewFormProps {
  child: Partial<Person>[];
  mother: Partial<Person>;
  father: Partial<Person>;
  informant: Partial<Person>;
  isAbandoned: boolean;
}

export const ReviewForm: FC<ReviewFormProps> = ({
  child,
  mother,
  father,
  informant,
  isAbandoned = false,
}) => {
  const t = useTranslations();
  return (
    <FormWrap
      prevUrl="/add/informant"
      className="space-y-4"
      nextLabel={t("Common.sendForConfirmation")}
      nextUrl="/add/confirmation"
      submitType="hidden"
    >
      <DataBlock title={t(`DetailsPage.title-final-review`)}>
        <FinalChildForm defaultValues={child} />
        {!isAbandoned && <FinalMotherForm defaultValues={mother} />}
        {mother.maritalStatus === "Married" && !isAbandoned && (
          <FinalFatherForm defaultValues={father} />
        )}
        <FinalInformantForm defaultValues={informant} />
      </DataBlock>
    </FormWrap>
  );
};
