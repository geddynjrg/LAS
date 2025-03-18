import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";
import { DataPair } from "@workspace/ui/components/data-pair";
import { IconCheck } from "@workspace/ui/components/icon-check";
import { cn } from "@workspace/ui/lib/utils";

export default async function Page() {
  return (
    <Container
      className={cn("grow-1 flex flex-col items-center gap-3", "mb-20 mt-7")}
    >
      <IconCheck className={cn("h-[4.75rem] w-[4.75rem]")} />

      <div className={cn("flex flex-col items-center gap-7", "text-center")}>
        <h2 className={cn("typo-h2")}>Thank you for your application!</h2>

        <p>
          It has successfully reached our systems and we will begin reviewing it
          as soon as possible.
        </p>

        <DataPair className={cn("w-full gap-2")}>
          <Button className={cn("grow-1 px-3")} variant="secondary" asChild>
            <a href="#" download="Application">
              Download application
            </a>
          </Button>
          <Button className={cn("grow-1 px-3")} variant="secondary">
            Send to e-mail
          </Button>
        </DataPair>

        <p className={cn("border-t border-solid border-neutral-400", "pt-7")}>
          You can also track the progress of your application on your account
          dashboard.
        </p>

        <Button className={cn("w-full max-w-[27rem]")} asChild>
          <a href="#">Go to my applications</a>
        </Button>
      </div>
    </Container>
  );
}
