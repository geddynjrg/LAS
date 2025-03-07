import { Container } from "@workspace/ui/components/container";

export interface GroupDataPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: GroupDataPageProps) {
  const { id } = await params;

  return <Container>Group data - Step: {id}</Container>;
}
