import { ReactNode } from "react";

export interface ApplyLayoutProps {
  children?: ReactNode;
}

export default function ApplyLayout({ children }: ApplyLayoutProps) {
  return (
    <>
      <div className="h-(--header-height) md:hidden" />
      {children}
    </>
  );
}
