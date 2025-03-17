import { Container } from "@workspace/ui/components/container";

export interface SuccessPageProps {
  params: Promise<{}>;
}

export default async function SuccessPage({}: SuccessPageProps) {
  return <Container>success page</Container>;
}
