import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("Common.loading");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="space-y-4 text-center">
        <div className="relative mx-auto h-16 w-16">
          <div className="absolute inset-0 rounded-full border-2 border-neutral-200"></div>
          <div className="border-t-primary absolute inset-0 animate-spin rounded-full border-2 border-transparent"></div>
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium text-neutral-700">
            {t("creatingApplication")}
          </p>
          <p className="mx-auto max-w-md text-sm text-neutral-500">
            {t("creatingApplicationDescription")}
          </p>
        </div>
      </div>
    </div>
  );
}
