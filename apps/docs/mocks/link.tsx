import type { AnchorHTMLAttributes } from "react";

/**
 * A mock component for the next/link outside of NextJS project.
 */
export default function Link(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} />;
}
