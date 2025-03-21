import type { ApplyStep } from "@/app/apply/[id]/layout";

export const MAX_FILE_SIZE = 1e6;

export const steps: ApplyStep[] = [
  { index: 1, title: "Group data", path: "/group-data" },
  { index: 2, title: "Group members", path: "/members" },
  { index: 3, title: "Loan conditions", path: "/loan-conditions" },
  { index: 4, title: "Proposed business", path: "/proposed-business" },
  { index: 5, title: "Confirmations", path: "/confirmations" },
  { index: 6, title: "Final review", path: "/review" },
];
