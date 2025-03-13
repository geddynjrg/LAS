import commonEn from "@workspace/ui/messages/en";

import en from "@/messages/en.json";

type Messages = typeof en & typeof commonEn;

declare global {
  // Use type safe message keys with `next-intl`
  interface IntlMessages extends Messages {}
}
