import { ChevronDown, FileCheck2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@workspace/ui/components/button";
import { Flag } from "@workspace/ui/components/flag";

import { HeroSection } from "@/components/hero-section";

export default function Page() {
  const t = useTranslations("FrontPage");

  return (
    <div className="flex flex-1 flex-col">
      <HeroSection
        title={t.rich("title", {
          light: (chunks) => <span className="block font-light">{chunks}</span>,
        })}
        backgroundUrl="/hero-banners/banner-1.jpg"
        backgroundAlt="A person working on a computer"
        actions={
          <>
            <Button variant="secondary">
              Learn more <ChevronDown />
            </Button>
            <Button>
              Apply now <FileCheck2 />
            </Button>
          </>
        }
      >
        {t("description")}
      </HeroSection>
      <hr className="my-5" />

      <Button size="sm">Button</Button>
      <Button size="sm" variant="danger">
        Button 2
      </Button>

      <Flag code="NL" />
    </div>
  );
}
