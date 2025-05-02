import { IconDownload, IconX } from "@tabler/icons-react";
import { type FC } from "react";

import { Button } from "@workspace/ui/components/button";
import { FileUploadInput } from "@workspace/ui/components/file-upload-input";
import { Field, Form, SubmitButton } from "@workspace/ui/components/form";
import { Underline } from "@workspace/ui/components/underline";
import { useForm } from "@workspace/ui/hooks/use-form";
import { cn } from "@workspace/ui/lib/utils";

import { uploadPaymentProofAction } from "@/app/dashboard/application-card/upload-payment-proof-action";
import {
  FILE_ACCEPT,
  MAX_FILE_SIZE,
  uploadPaymentProofSchema,
} from "./upload-payment-proof-schema";

export interface UploadPaymentProofFormProps {
  isHighlighted?: boolean;
  onClose: () => void;
  application_id: string;
}

export const UploadPaymentProofForm: FC<UploadPaymentProofFormProps> = ({
  isHighlighted,
  onClose,
  application_id,
}) => {
  const [state, formAction, isPending] = useForm(
    uploadPaymentProofAction,
    uploadPaymentProofSchema,
  );

  return (
    <Form
      action={formAction}
      className={cn(
        "relative space-y-4 rounded border border-yellow-500 bg-yellow-100 p-4",
        isHighlighted && "repeat-[4] animate-pulse duration-500",
      )}
    >
      <input type="hidden" name="id" value={application_id} />
      <Button
        variant="ghost"
        size="xs"
        className="absolute right-1 top-1"
        onClick={onClose}
      >
        <IconX />
      </Button>
      <p>
        Complete the transfer and upload proof of payment, such as a receipt or
        screenshot.
      </p>
      <Underline asChild>
        <a
          href={`/apply/${application_id}/payment-info-pdf`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconDownload className="mr-2" /> Download payment instructions
        </a>
      </Underline>

      <Field
        state={state}
        name="payment_proof"
        label="Proof of payment"
        required
        control={(props) => (
          <FileUploadInput
            accept={FILE_ACCEPT}
            maxSize={MAX_FILE_SIZE}
            {...props}
          />
        )}
      />
      <SubmitButton disabled={isPending} className="w-full">
        Upload proof of payment
      </SubmitButton>
    </Form>
  );
};
