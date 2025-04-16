import type { FC, ReactNode } from "react";

import { Container } from "@workspace/ui/components/container";

export interface ApplyFormTitleProps {
  label?: ReactNode;
  children?: ReactNode;
}

export const ApplyFormTitle: FC<ApplyFormTitleProps> = ({
  label,
  children,
}) => {
  return (
    <Container>
      {label && <p>{label}</p>}
      <h2 className="typo-h2">{children}</h2>
    </Container>
  );
};
