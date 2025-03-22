"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, type FC } from "react";

import { IconCheck } from "@workspace/ui/components/icon-check";
import { Loader } from "@workspace/ui/components/loader";

import { FormWrap } from "@/app/add/form-wrap";
import type { Person } from "@/lib/schema/person-schema";
import { saveForm } from "@/lib/services/birth-registration-service";

export interface ConfirmationFormProps {
  defaultValues: Partial<Person>;
}

export const ConfirmationForm: FC<ConfirmationFormProps> = ({
  defaultValues,
}) => {
  const t = useTranslations();
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      await saveForm();
      setConfirmed(true);
    }, 3000);

    return () => clearTimeout(timer); // Cleanup on unmount
  }, []);

  return confirmed ? (
    <FormWrap
      prevUrl="/"
      className="flex h-screen flex-col justify-center space-y-4"
      prevLabel="Close form"
      submitType="hidden"
      hasBtnIcons={false}
    >
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="max-w-xs text-center">
          <IconCheck className="m-auto mb-10" />
          <p className="typo-h3">
            Birth notification successfully confirmed and submitted
          </p>
        </div>
      </div>
    </FormWrap>
  ) : (
    <FormWrap
      prevUrl="/add/final-review"
      className="flex h-screen flex-col justify-center space-y-4"
      prevLabel="Cancel"
      submitType="hidden"
      hasBtnIcons={false}
    >
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="max-w-xs text-center">
          <Loader animation="subtle" size={130} className="m-auto mb-10" />
          <p className="typo-h3">Waiting for confirmation from</p>
          <p className="typo-h5">
            {defaultValues.firstName} {defaultValues.lastName}
          </p>
          <p className="text-xl">
            +{defaultValues?.contacts?.[0]?.phoneCode}{" "}
            {defaultValues?.contacts?.[0]?.phone}
          </p>
        </div>
      </div>
    </FormWrap>
  );
};
