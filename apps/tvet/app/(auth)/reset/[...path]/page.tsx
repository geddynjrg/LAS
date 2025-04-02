import { ResetForm } from "@/app/(auth)/reset/[...path]/reset-form";

export interface ResetPasswordPageProps {
  params: Promise<{
    path: string[];
  }>;
}

export default async function PasswordChangePage(
  props: ResetPasswordPageProps,
) {
  const params = await props.params;
  const [uid, timeStamp, hash] = params.path;

  if (!uid || !timeStamp || !hash) {
    throw new Error("Invalid parameters");
  }

  return <ResetForm uid={uid} timeStamp={timeStamp} hash={hash} />;
}
