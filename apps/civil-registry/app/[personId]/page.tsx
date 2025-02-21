"use client";

import { IconArrowLeft, IconCheck, IconEdit } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { type FC, type ReactNode } from "react";

import { ActionBar } from "@workspace/ui/components/action-bar";
import { Button } from "@workspace/ui/components/button";
import { SectionWrap } from "@workspace/ui/components/civil-registry/section-wrap";
import { DataNode } from "@workspace/ui/components/data-node";
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

  return (
    <>
      <SectionWrap className={cn("space-y-6")} hasTopPadding hasBottomPadding>
        <Button asChild variant="secondary">
          <Link href="/" className={cn("!px-7")}>
            <IconArrowLeft /> {t("Details.to-dashboard")}
          </Link>
        </Button>

        <h2 className={cn("typo-h2")}>{person.name}</h2>

        <div className={cn("space-y-12")}>
          <Child />
          <Mother />
          <Father />
        </div>
      </SectionWrap>
      <ActionBar>
        <Button asChild variant="secondary">
          <a href="/" className={cn("!px-5")}>
            <IconArrowLeft /> {t("Details.back")}
          </a>
        </Button>
        <ModalButton
          modalTitle="Confirm registration?"
          modalText="Are you sure all the details of the birth registration are correct? You have the option to amend."
        >
          {t("Details.confirm-registration?")} <IconCheck />
        </ModalButton>
      </ActionBar>
    </>
  );
}

const Child: FC = () => {
  const child = MOCK_PERSON.child;
  const t = useTranslations();

  return (
    <DataBlock
      key={child.id}
      title={t("Details.title-child")}
      description={t("Details.description")}
    >
      <DataNode label={t("Details.name")}>{child.name}</DataNode>
      <DataNode label={t("Details.dob")}>{child.dob}</DataNode>
      <DataNode label={t("Details.age")}>{child.age}</DataNode>
      <DataNode label={t("Details.sex")}>{child.sex}</DataNode>
      <DataNode label={t("Details.birth-weight")}>
        {child.weightOnBirth}
      </DataNode>
      <DataNode label={t("Details.place-of-birth")}>
        {child.placeOfBirth}
      </DataNode>
    </DataBlock>
  );
};

const Mother: FC = () => {
  const mother = MOCK_PERSON.mother;
  const t = useTranslations();

  return (
    <DataBlock title={t("Details.title-mother")}>
      <DataNode label={t("Details.name")}>{mother.name}</DataNode>
      <DataNode label={t("Details.national-id")}>{mother.nationalId}</DataNode>
      <DataNode label={t("Details.dob")}>{mother.dob}</DataNode>
      <DataNode label={t("Details.citizenship")}>{mother.citizenship}</DataNode>
      <DataNode label={t("Details.nationality")}>{mother.nationality}</DataNode>
      <DataNode label={t("Details.marital-status")}>
        {mother.maritalStatus}
      </DataNode>
      <DataNode label={t("Details.education")}>{mother.education}</DataNode>
      <DataNode label={t("Details.fathers-name")}>{mother.father}</DataNode>
      <DataNode label={t("Details.phone")}>{mother.phone}</DataNode>
    </DataBlock>
  );
};

const Father: FC = () => {
  const father = MOCK_PERSON.father;
  const t = useTranslations();

  return (
    <DataBlock title={t("Details.title-father")}>
      <DataNode label={t("Details.name")}>{father.name}</DataNode>
      <DataNode label={t("Details.national-id")}>{father.nationalId}</DataNode>
      <DataNode label={t("Details.dob")}>{father.dob}</DataNode>
      <DataNode label={t("Details.citizenship")}>{father.citizenship}</DataNode>
      <DataNode label={t("Details.nationality")}>{father.nationality}</DataNode>
      <DataNode label={t("Details.education")}>{father.education}</DataNode>
      <DataNode label={t("Details.phone")}>{father.phone}</DataNode>
    </DataBlock>
  );
};

const DataBlock: FC<{
  children: ReactNode;
  title: string;
  description?: string;
}> = ({ children, title, description }) => {
  const t = useTranslations();
  return (
    <div>
      <div className={cn("flex items-center gap-4")}>
        <h3 className={cn("typo-h3")}>{title}</h3>
        <Button asChild variant="secondary">
          <Link href="#amend" className={cn("!px-5")}>
            {t("Details.amend")} <IconEdit />
          </Link>
        </Button>
      </div>
      {description && <p className={cn("mt-1")}>{description}</p>}
      <div
        className={cn(
          "mt-3 space-y-4 border-t border-solid border-neutral-400 pt-3",
        )}
      >
        {children}
      </div>
    </div>
  );
};
