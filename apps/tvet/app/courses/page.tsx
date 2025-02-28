import { Container } from "@workspace/ui/components/container";

import { Heading } from "@/components/heading";

export default function Page() {
  return (
    <>
      <div className="bg-primary text-primary-foreground max-md:pt-22 px-4 pb-4">
        <Heading>All courses</Heading>
        <>
          Here you can find and search all the courses offered by all the
          Nairobi County TVETs.
        </>
      </div>
      <Container></Container>
    </>
  );
}
