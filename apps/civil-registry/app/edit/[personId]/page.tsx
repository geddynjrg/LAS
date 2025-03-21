import { getPersonById } from "@/actions/get-person-by-id";
import { ContentBlock } from "@/app/edit/[personId]/content-block/content-block";

export interface DetailsPageProps {
  params: Promise<{ personId: string }>;
}

export default async function DetailsPage({ params }: DetailsPageProps) {
  const { personId } = await params;

  if (!personId) {
    return <p>Error: person Id is missing</p>;
  }

  const person = await getPersonById(personId);

  if (!person) {
    return <p>Error: person not found</p>;
  }

  return <ContentBlock person={person} />;
}
