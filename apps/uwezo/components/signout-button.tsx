import type { FC, ReactNode } from "react";

import { Slot } from "@workspace/ui/components/slot";

import { signOut } from "@/lib/auth";

export interface SignoutButtonProps {
  children?: ReactNode;
  className?: string;
  asChild?: boolean;
}

async function signOutAction() {
  "use server";
  return signOut();
}

export const SignoutButton: FC<SignoutButtonProps> = ({
  asChild,
  ...props
}) => {
  const Comp = asChild ? Slot : "button";

  return (
    <form action={signOutAction}>
      <Comp type="submit" {...props} />
    </form>
  );
};
