import { Step1Form } from "@/app/apply/[step]/step-1-form";

export interface StepPageProps {
  params: Promise<{ step: string }>;
}

export default async function StepPage({ params }: StepPageProps) {
  const { step } = await params;

  switch (step) {
    case "1":
      return <Step1Form />;
    case "2":
      return <div>Step 2</div>;
    case "3":
      return <div>Step 3</div>;
    case "4":
      return <div>Step 4</div>;
    case "5":
      return <div>Step 5</div>;
    default:
      return <div>Invalid step</div>;
  }
}
