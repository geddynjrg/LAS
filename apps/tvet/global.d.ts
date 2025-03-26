import commonEn from "@workspace/ui/messages/en-gb.json";

import en from "@/messages/en-gb.json";

type Messages = typeof en & typeof commonEn;

declare global {
  // Use type safe message keys with `next-intl`
  interface IntlMessages extends Messages {}
}
