import { ReactNode } from "react";

import { Authenticated } from "@/components/authenticated";
import { getSession } from "@/lib/session";

export interface CreateLayoutProps {
  children?: ReactNode;
}

export default async function CreateLayout({ children }: CreateLayoutProps) {
  const session = await getSession();

  return (
    <Authenticated session={session ? true : null}>{children}</Authenticated>
  );
}
