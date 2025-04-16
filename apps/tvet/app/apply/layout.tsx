import { ReactNode } from "react";

export interface ApplyLayoutProps {
  children?: ReactNode;
}

export default function ApplyLayout({ children }: ApplyLayoutProps) {
  return (
    <>
      <div className="h-(--header-height) bg-radial-[at_25%_25%] mb-8 from-[#81c87f] to-[#649564] to-75%" />

      {children}
    </>
  );
}
