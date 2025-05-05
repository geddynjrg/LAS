import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";
import { Heading } from "@workspace/ui/components/tvet/heading";

import { ApplicationCard } from "@/app/dashboard/application-card/application-card";
import { getProfile } from "@/lib/api/profile";
import { getUserApplications } from "@/lib/api/user-applications";

export default async function DashboardPage() {
  const t = await getTranslations("DashboardPage");
  const [userProfile, userApplications] = await Promise.all([
    getProfile(),
    getUserApplications(),
  ]);

  console.log(userApplications);

  return (
    <Container className="mb-8">
      <h5 className="typo-h5 mb-1">{userProfile?.data.name}</h5>
      <Heading type="h2">{t("title")}</Heading>

      {userApplications.length > 0 ? (
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {userApplications.map((application) => (
            <ApplicationCard key={application.id} {...application} />
          ))}
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center justify-center gap-4">
          <h5 className="typo-h5 text-neutral-700">{t("noApplications")}</h5>
          <Button asChild>
            <Link href={`/apply`}>{t("applyNow")}</Link>
          </Button>
        </div>
      )}
    </Container>
  );
}
