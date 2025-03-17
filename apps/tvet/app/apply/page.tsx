import Link from "next/link";

import { ActionBar } from "@workspace/ui/components/action-bar";
import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";
import {
  NumberedList,
  NumberedListItem,
} from "@workspace/ui/components/numbered-list";

export default function ApplyPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Container className="max-w-[500px] flex-1">
        <h2 className="typo-h2">Before you start</h2>
        <p className="mt-4">
          Here are some things you should know before starting the application
          process
        </p>
        <NumberedList
          variant="bulletNumbers"
          bulletAlignment="top"
          className="mx-auto mt-8"
        >
          <NumberedListItem>
            <p className="typo-h6">
              Here are some things you should know before starting the
              application process
            </p>
            <p className="mt-2">
              This fee doesn’t guarantee admittance, it’s for processing your
              application
            </p>
          </NumberedListItem>
          <NumberedListItem>
            <p className="typo-h6">You will need some form of ID</p>
            <p className="mt-2">
              You will need to upload a picture of either your National ID,
              Birth Certificate or Alien ID
            </p>
          </NumberedListItem>
          <NumberedListItem>
            <p className="typo-h6">If you don’t have any form of ID</p>
            <p className="mt-2">
              You will need to contact the institution directly and discuss
              options for applying. The institution contact are on the
              institution page
            </p>
          </NumberedListItem>
        </NumberedList>
      </Container>

      <ActionBar>
        <Button className="px-22 mx-auto" asChild>
          <Link href="/apply/1/applicant">Understood</Link>
        </Button>
      </ActionBar>
    </div>
  );
}
