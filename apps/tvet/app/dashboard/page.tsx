import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { SectionWrap } from "@workspace/ui/components/civil-registry/section-wrap";
import { ApplicationStatusCard } from "@workspace/ui/components/tvet/application-status-card";
import { Heading } from "@workspace/ui/components/tvet/heading";
import { cn } from "@workspace/ui/lib/utils";

import { getProfile } from "@/lib/api/profile";
import { getUserApplications } from "@/lib/api/user-applications";

export default async function DashboardPage() {
  const userProfile = await getProfile();
  const userApplications = await getUserApplications();
  const t = await getTranslations("DashboardPage");

  return (
    <SectionWrap hasBottomPadding>
      <h5 className={cn("typo-h5 mb-1")}>{userProfile?.data.name}</h5>
      <Heading type="h2">{t("title")}</Heading>

      <div className={cn("mt-7 space-y-5")}>
        <div
          className={cn(
            "flex flex-col gap-5",
            "md:grid md:grid-cols-2 md:flex-row md:flex-wrap",
            "empty:hidden",
          )}
        >
          {userApplications &&
            userApplications.data.length > 0 &&
            userApplications.data.map((application, index) => (
              <ApplicationStatusCard
                {...application}
                key={`application_${index}`}
              />
            ))}
        </div>
      </div>
      {(!userApplications || userApplications.data.length === 0) && (
        <div className="flex flex-col items-center justify-center gap-4">
          <h5 className={cn("typo-h5 text-neutral-700")}>
            {t("noApplications")}
          </h5>
          <Button asChild>
            <Link href={`/apply`}>{t("startApplying")}</Link>
          </Button>
        </div>
      )}
    </SectionWrap>
  );
}
