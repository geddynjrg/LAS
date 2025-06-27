import { ReactNode } from "react";

import { Authenticated } from "@/components/authenticated";
import { auth } from "@/lib/auth";

export interface CreateLayoutProps {
  children?: ReactNode;
}

export default async function CreateLayout({ children }: CreateLayoutProps) {
  const session = await auth();

  return (
    <Authenticated session={session ? true : null}>{children}</Authenticated>
  );
}
