import { ReactNode } from "react";

import { Container } from "@workspace/ui/components/container";

export interface ApplyLayoutProps {
  children?: ReactNode;
}

export default function ApplyLayout({ children }: ApplyLayoutProps) {
  return (
    <>
      <div className="h-(--header-height) bg-primary mb-8" />

      {children}
    </>
  );
}
