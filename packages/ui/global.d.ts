import en from "@workspace/ui/messages/en.json";

type Messages = typeof en;

declare module "next-intl" {
  interface AppConfig {
    Locale: "en";
    Messages: Messages;
  }
}
