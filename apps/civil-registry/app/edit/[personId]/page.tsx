import { getPersonById } from "@/actions/get-person-by-id";
import { ContentBlock } from "@/app/edit/[personId]/content-block/content-block";

export interface DetailsPageProps {
  params: Promise<{ personId: string }>;
}

export default async function DetailsPage({ params }: DetailsPageProps) {
  const { personId } = await params;
  const person = await getPersonById(personId);

  if (!person) {
    throw new Error("Person not found");
  }

  return <ContentBlock person={person} />;
}
