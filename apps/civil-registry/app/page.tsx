"use server";

import { redirect } from "next/navigation";

export default async function Page() {
  redirect("/1"); // Redirect to "/[id]/page"
}
