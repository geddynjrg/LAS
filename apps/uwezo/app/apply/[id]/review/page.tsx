import { Container } from "@workspace/ui/components/container";
import { InfoPopover } from "@workspace/ui/components/info-popover";

export default async function Page() {
  return (
    <>
      <InfoPopover />
      <Container>Review</Container>;
    </>
  );
}
