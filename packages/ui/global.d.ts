import en from "@workspace/ui/messages/en-gb.json";

type Messages = typeof en;

declare module "next-intl" {
  interface AppConfig {
    Locale: "en-gb";
    Messages: Messages;
  }
}
