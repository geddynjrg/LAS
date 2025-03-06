import type { FC } from "react";

import { Alert } from "@workspace/ui/components/alert";
import { Card, type CardProps } from "@workspace/ui/components/card";
import { DataNode } from "@workspace/ui/components/data-node";
import { DataPair } from "@workspace/ui/components/data-pair";
import { cn } from "@workspace/ui/lib/utils";

export type SexType = "M" | "F";
export type ValidationStatus = "success" | "alert" | "pending";

export type PersonType = {
  id: string;
  name: string;
  sex: SexType;
  dob: string;
  age: string;
  validationStatus: ValidationStatus;
};

export interface PersonCardProps extends CardProps {
  person: PersonType;
}

export const PersonCard: FC<PersonCardProps> = ({ person, ...props }) => {
  const { name, sex, age, dob, validationStatus } = person ?? {};

  return (
    <Card title={name} {...props}>
      {validationStatus === "alert" && (
        <Alert variant="warning">Birth registration requires validation</Alert>
      )}

      {validationStatus === "pending" && (
        <Alert variant="warning">
          Amendments need to be processed before a birth certificate can be
          issued
        </Alert>
      )}

      <DataPair
        className={cn(
          "px-4",
          "sm:gap-8 sm:self-center",
          "md:gap-0 md:self-auto",
        )}
      >
        <DataNode label="Sex">{sex}</DataNode>
        <DataNode label="Age">{age}</DataNode>
        <DataNode label="Date of birth">{dob}</DataNode>
      </DataPair>
    </Card>
  );
};
