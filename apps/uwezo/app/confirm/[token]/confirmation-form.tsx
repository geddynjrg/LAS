"use client";

import { IconCheck, IconLoader2, IconX } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

import { Alert } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { useForm } from "@workspace/ui/hooks/use-form";

import { confirmMemberAction } from "@/app/actions/member-confirmation";
import {
  ConfirmationActionSchema,
  type MemberConfirmationSuccessResponse,
} from "@/lib/api/schema/member-confirmation.schema";

interface ConfirmationFormProps {
  token: string;
  onStatusUpdate?: (
    confirmationResponse: MemberConfirmationSuccessResponse,
  ) => void;
}

export function ConfirmationForm({
  token,
  onStatusUpdate,
}: ConfirmationFormProps) {
  const t = useTranslations("ConfirmationPage");
  const [isPending, startTransition] = useTransition();
  const [processingAction, setProcessingAction] = useState<
    "confirmed" | "declined" | null
  >(null);
  const [result, setResult] =
    useState<MemberConfirmationSuccessResponse | null>(null);

  const [state, formAction] = useForm(
    confirmMemberAction,
    ConfirmationActionSchema,
  );

  // Handle form state changes
  useEffect(() => {
    if (state?.success && state.data) {
      const responseData = state.data as MemberConfirmationSuccessResponse;
      setResult(responseData);
      setProcessingAction(null);

      // Update the parent component with the fresh API response data
      if (onStatusUpdate) {
        onStatusUpdate(responseData);
      }
    } else if (state?.errors) {
      setProcessingAction(null);
    }
  }, [state, onStatusUpdate]);

  const handleConfirmation = (action: "confirmed" | "declined") => {
    setResult(null);
    setProcessingAction(action);

    startTransition(() => {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("action", action);
      formAction(formData);
    });
  };

  // Show success message if confirmation was processed
  if (result) {
    const { data } = result;
    const isConfirmed = data.action === "confirmed";

    return (
      <Alert variant={isConfirmed ? "success" : "error"}>
        <div className="flex items-center gap-2">
          {isConfirmed ? (
            <IconCheck className="h-5 w-5 text-green-600" />
          ) : (
            <IconX className="h-5 w-5 text-red-600" />
          )}
          <div>
            <h3 className="font-semibold">
              {isConfirmed ? t("confirmationSuccess") : t("declineSuccess")}
            </h3>
            <p className="text-sm">{result.message}</p>
            {data.confirmation_timestamp && (
              <p className="mt-1 text-xs text-neutral-500">
                {t("processedAt")}:{" "}
                {new Date(data.confirmation_timestamp * 1000).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </Alert>
    );
  }

  // Show error messages
  if (state?.errors?.action || state?.errors?.token) {
    const errorMessage = (
      state.errors.action?.[0] || state.errors.token?.[0]
    )?.toString();
    return (
      <Alert variant="error">
        <IconX className="h-5 w-5" />
        <div>
          <h3 className="font-semibold">{t("errorTitle")}</h3>
          <p>{errorMessage}</p>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="mb-2 font-semibold">{t("confirmationPrompt")}</h3>
        <p className="mb-4 text-sm text-neutral-600">
          {t("confirmationInstructions")}
        </p>
      </div>

      <div className="flex justify-center gap-4">
        <Button
          onClick={() => handleConfirmation("confirmed")}
          disabled={isPending && processingAction === "confirmed"}
          className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
          size="lg"
        >
          {isPending && processingAction === "confirmed" ? (
            <IconLoader2 className="h-5 w-5 animate-spin" />
          ) : (
            <IconCheck className="h-5 w-5" />
          )}
          {t("confirmButton")}
        </Button>

        <Button
          onClick={() => handleConfirmation("declined")}
          disabled={isPending && processingAction === "declined"}
          variant="danger"
          className="flex items-center gap-2"
          size="lg"
        >
          {isPending && processingAction === "declined" ? (
            <IconLoader2 className="h-5 w-5 animate-spin" />
          ) : (
            <IconX className="h-5 w-5" />
          )}
          {t("declineButton")}
        </Button>
      </div>

      {isPending && processingAction && (
        <div className="text-center">
          <p className="text-sm text-neutral-600">{t("processing")}</p>
        </div>
      )}
    </div>
  );
}
