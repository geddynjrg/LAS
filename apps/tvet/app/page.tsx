import { useTranslations } from "next-intl";

import { Button } from "@workspace/ui/components/button";

import { HeroSection } from "@/components/hero-section";

export default function Page() {
  const t = useTranslations("FrontPage");

  return (
    <div className="flex flex-1 flex-col">
      <HeroSection
        // title={t("title")}
        title={
          <span className="font-light">
            Where did i get
            <br />
            <strong>so skilled ?</strong>
          </span>
        }
        backgroundUrl="/hero-banners/banner-1.jpg"
        backgroundAlt="A person working on a computer"
      >
        At TVETs we put focus on practical skills - up to 90% of training is
        through practice. Programs are designed around occupational standards,
        curriculas are developed with strong integration with businesses.
      </HeroSection>
      <hr className="my-5" />
      <p>{t("title")}</p>
      <Button size="sm">Button</Button>
      <Button size="sm" variant="danger">
        Button 2
      </Button>
    </div>
  );
}
