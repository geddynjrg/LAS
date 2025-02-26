import { getRequestConfig } from "next-intl/server";

import { getMessages, getUserLocale } from "@/lib/locale";

export default getRequestConfig(async () => {
  const locale = await getUserLocale();

  return {
    locale,
    messages: await getMessages(locale),
  };
});
