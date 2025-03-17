import { redirect } from "next/navigation";

export default function ApplyPage() {
  redirect("login/phone?callbackUrl=/apply/introduction");

  return null;
}
