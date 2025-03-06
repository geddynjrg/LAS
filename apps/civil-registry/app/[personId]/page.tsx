"use client";

import {
  IconArrowLeft,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconInfoSquareRounded,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useState, type FC, type ReactNode } from "react";

import { ActionBar } from "@workspace/ui/components/action-bar";
import { Button } from "@workspace/ui/components/button";
import { BackButton } from "@workspace/ui/components/civil-registry/back-button";
import {
  DataBlock,
  DataBlockProps,
} from "@workspace/ui/components/civil-registry/data-block";
import { SectionWrap } from "@workspace/ui/components/civil-registry/section-wrap";
import { DataNode } from "@workspace/ui/components/data-node";
import { DataPair } from "@workspace/ui/components/data-pair";
import { ModalButton } from "@workspace/ui/components/modal-button";
import { cn } from "@workspace/ui/lib/utils";

export interface DetailsPageProps {
  params: Promise<{ personId: string }>;
}

const MOCK_PERSON = {
  name: "David Otieno",
  child: {
    id: "1",
    name: "David Otieno",
    dob: "23.04.2022",
    age: "2 years",
    sex: "Male",
    weightOnBirth: "3.1 kg",
    placeOfBirth: "Kajiado County Referral Hospital",
  },
  mother: {
    name: "Mary Maisha Otieno",
    nationalId: "2934873249",
    dob: "02.02.1990",
    citizenship: "Kenyan",
    nationality: "Kenyan",
    maritalStatus: "Married",
    education: "Master’s degree",
    father: "Waweru",
    phone: "+254 1123 67464",
  },
  father: {
    name: "John Otieno",
    nationalId: "2934873249",
    dob: "01.01.1990",
    citizenship: "Kenyan",
    nationality: "Kenyan",
    education: "Master’s degree",
    phone: "+254 734 88347",
  },
};

export default function DetailsPage({ params }: DetailsPageProps) {
  const person = MOCK_PERSON;
  const t = useTranslations();

  // mock confirmation bar visibility;
  const showConfirmationBar = false;
  // mock payement bar visibility;
  const showPaymentBar = true;

  return (
    <>
      <SectionWrap className={cn("space-y-6")} hasTopPadding hasBottomPadding>
        <BackButton />

        <h2 className={cn("typo-h2")}>{person.name}</h2>

        <div className={cn("space-y-12")}>
          <Child disabled={false} active={false} />
          <Mother disabled={false} active={false} />
          <Father disabled={false} active={false} />
        </div>
      </SectionWrap>

      {showPaymentBar && (
        <PaymentBar price={250} onSubmit={() => console.log("Submit")} />
      )}

      {showConfirmationBar && (
        <ActionBar>
          <Button asChild variant="secondary">
            <a href="/" className={cn("!px-5")}>
              <IconArrowLeft /> {t("DetailsPage.back")}
            </a>
          </Button>
          <ModalButton
            modalTitle="Confirm registration?"
            modalText="Are you sure all the details of the birth registration are correct? You have the option to amend."
            onConfirm={() => alert("Not implemented!")}
          >
            {t("DetailsPage.confirm-registration?")} <IconCheck />
          </ModalButton>
        </ActionBar>
      )}
    </>
  );
}

const Child: FC<
  Pick<DataBlockProps, "active" | "disabled" | "onSubmit" | "onCancel">
> = ({ disabled, active }) => {
  const child = MOCK_PERSON.child;
  const t = useTranslations();

  type DataVariant = "default" | "disabled";
  const variant: DataVariant = disabled ? "disabled" : "default";

  return (
    <DataBlock
      key={child.id}
      title={t("DetailsPage.title-child")}
      description={t("DetailsPage.description")}
      disabled={disabled}
      active={active}
      onCancel={() => console.log("Cancel called")}
      onSubmit={() => console.log("Submit called")}
    >
      <DataNode label={t("DetailsPage.name")} variant={variant}>
        {child.name}
      </DataNode>
      <DataNode label={t("DetailsPage.dob")} variant={variant}>
        {child.dob}
        {active && (
          <EditMessage>{t("DetailsPage.change-dob-message")}</EditMessage>
        )}
      </DataNode>
      <DataNode label={t("DetailsPage.age")} variant={variant}>
        {child.age}
      </DataNode>
      <DataNode label={t("DetailsPage.sex")} variant={variant}>
        {child.sex}
        {active && (
          <EditMessage>{t("DetailsPage.change-sex-message")}</EditMessage>
        )}
      </DataNode>
      <DataNode label={t("DetailsPage.birth-weight")} variant={variant}>
        {child.weightOnBirth}
      </DataNode>
      <DataNode label={t("DetailsPage.place-of-birth")} variant={variant}>
        {child.placeOfBirth}
      </DataNode>
    </DataBlock>
  );
};

const Mother: FC<
  Pick<DataBlockProps, "active" | "disabled" | "onSubmit" | "onCancel">
> = ({ disabled, active }) => {
  const mother = MOCK_PERSON.mother;
  const t = useTranslations();

  type DataVariant = "default" | "disabled";
  const variant: DataVariant = disabled ? "disabled" : "default";

  return (
    <DataBlock
      title={t("DetailsPage.title-mother")}
      disabled={disabled}
      active={active}
      onCancel={() => console.log("Cancel called")}
      onSubmit={() => console.log("Submit called")}
    >
      <DataNode label={t("DetailsPage.name")} variant={variant}>
        {mother.name}
      </DataNode>
      <DataNode label={t("DetailsPage.national-id")} variant={variant}>
        {mother.nationalId}
      </DataNode>
      <DataNode label={t("DetailsPage.dob")} variant={variant}>
        {mother.dob}
      </DataNode>
      <DataNode label={t("DetailsPage.citizenship")} variant={variant}>
        {mother.citizenship}
      </DataNode>
      <DataNode label={t("DetailsPage.nationality")} variant={variant}>
        {mother.nationality}
      </DataNode>
      <DataNode label={t("DetailsPage.marital-status")} variant={variant}>
        {mother.maritalStatus}
      </DataNode>
      <DataNode label={t("DetailsPage.education")} variant={variant}>
        {mother.education}
      </DataNode>
      <DataNode label={t("DetailsPage.fathers-name")} variant={variant}>
        {mother.father}
      </DataNode>
      <DataNode label={t("DetailsPage.phone")} variant={variant}>
        {mother.phone}
      </DataNode>
    </DataBlock>
  );
};

const Father: FC<
  Pick<DataBlockProps, "active" | "disabled" | "onSubmit" | "onCancel">
> = ({ disabled, active }) => {
  const father = MOCK_PERSON.father;
  const t = useTranslations();

  type DataVariant = "default" | "disabled";
  const variant: DataVariant = disabled ? "disabled" : "default";

  return (
    <DataBlock
      title={t("DetailsPage.title-father")}
      disabled={disabled}
      active={active}
      onCancel={() => console.log("Cancel called")}
      onSubmit={() => console.log("Submit called")}
    >
      <DataNode label={t("DetailsPage.name")} variant={variant}>
        {father.name}
      </DataNode>
      <DataNode label={t("DetailsPage.national-id")} variant={variant}>
        {father.nationalId}
      </DataNode>
      <DataNode label={t("DetailsPage.dob")} variant={variant}>
        {father.dob}
      </DataNode>
      <DataNode label={t("DetailsPage.citizenship")} variant={variant}>
        {father.citizenship}
      </DataNode>
      <DataNode label={t("DetailsPage.nationality")} variant={variant}>
        {father.nationality}
      </DataNode>
      <DataNode label={t("DetailsPage.education")} variant={variant}>
        {father.education}
      </DataNode>
      <DataNode label={t("DetailsPage.phone")} variant={variant}>
        {father.phone}
      </DataNode>
    </DataBlock>
  );
};

const EditMessage: FC<{ children: ReactNode }> = ({ children }) => (
  <div className={cn("text-blue-400", "flex items-center gap-1")}>
    <IconInfoSquareRounded size={20} className={cn("shrink-0")} />
    {children}
  </div>
);

const PaymentBar: FC<{ onSubmit: () => void; price: number }> = ({
  price,
  onSubmit,
}) => {
  const t = useTranslations();
  const [viewDetails, setViewDetails] = useState(false);

  return (
    <ActionBar>
      <Button
        variant="ghost"
        className={cn(
          "absolute bottom-full left-1/2 -translate-x-1/2",
          "rounded-bl-none rounded-br-none rounded-tl-xl rounded-tr-xl",
          "shadow-[var(--box-shadow-elevation-04)]",
          "bg-neutral-100 text-blue-400",
          "hover:bg-neutral-100 hover:text-blue-400",
          "active:bg-neutral-100",
        )}
        onClick={() => setViewDetails(!viewDetails)}
      >
        {viewDetails ? <IconChevronDown /> : <IconChevronUp />}
        {t("DetailsPage.view-const-breakdown")}
      </Button>
      <div className={cn("flex flex-grow flex-col gap-3")}>
        <div>
          <div className={cn("flex flex-grow items-center justify-between")}>
            <div>{t("DetailsPage.amendment-cost-label")}</div>
            <div className={cn("typo-h5")}>{price} KSh</div>
          </div>

          {viewDetails && (
            <>
              <DataPair className={cn("text-sm")}>
                <div>Child's name change</div>
                <div className={cn("font-bold")}>250 KSh</div>
              </DataPair>
              <DataPair className={cn("text-sm")}>
                <div>Child's name change</div>
                <div className={cn("font-bold")}>250 KSh</div>
              </DataPair>
              <DataPair className={cn("text-sm")}>
                <div>Child's name change</div>
                <div className={cn("font-bold")}>250 KSh</div>
              </DataPair>
            </>
          )}
        </div>

        <div className={cn("flex flex-grow justify-between")}>
          <Button asChild variant="secondary">
            <a href="/" className={cn("!px-5")}>
              <IconArrowLeft /> {t("DetailsPage.back")}
            </a>
          </Button>
          <ModalButton
            onConfirm={onSubmit}
            modalTitle={t("DetailsPage.confirm-amendments-title")}
            modalText={t("DetailsPage.confirm-amendments-text")}
          >
            {t("DetailsPage.confirm-and-pay")} <IconCheck />
          </ModalButton>
        </div>
      </div>
    </ActionBar>
  );
};
