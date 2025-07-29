"use client";

import { IconAlertCircle, IconLoader2, IconRefresh } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@workspace/ui/components/button";

import { getMemberDetailsAction } from "@/app/actions/member-confirmation";
import type { MemberConfirmationSuccessResponse } from "@/lib/api/schema/member-confirmation.schema";
import { ConfirmationForm } from "./confirmation-form";
import { MemberDetailsCard } from "./member-details-card";

interface ConfirmationPageClientProps {
  token: string;
}

type LoadingState = "loading" | "success" | "error";

export function ConfirmationPageClient({ token }: ConfirmationPageClientProps) {
  const t = useTranslations("ConfirmationPage");
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [memberData, setMemberData] =
    useState<MemberConfirmationSuccessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const validateToken = useCallback(async () => {
    if (!token) {
      setError("No token provided");
      setLoadingState("error");
      return;
    }

    try {
      setError(null);
      if (!isRetrying) {
        setLoadingState("loading");
      }

      const formData = new FormData();
      formData.append("token", token);

      const result = await getMemberDetailsAction(null, formData);

      if (result.success && result.data) {
        setMemberData(result.data as MemberConfirmationSuccessResponse);
        setLoadingState("success");
      } else if (result.errors) {
        const errorMessage =
          result.errors.token?.[0]?.toString() || "Failed to validate token";
        // Check if it's a translation key
        const translatedMessage = errorMessage.startsWith("ConfirmationPage.")
          ? t(
              errorMessage.replace("ConfirmationPage.", "") as Parameters<
                typeof t
              >[0],
            )
          : errorMessage;
        setError(translatedMessage);
        setLoadingState("error");
      } else {
        setError(t("errors.unknownError"));
        setLoadingState("error");
      }
    } catch (err) {
      console.error("Error validating token:", err);
      setError(err instanceof Error ? err.message : t("errors.unknownError"));
      setLoadingState("error");
    } finally {
      setIsRetrying(false);
    }
  }, [token, isRetrying, t]);

  // Only call validateToken once when component mounts
  useEffect(() => {
    validateToken();
  }, [validateToken]);

  const handleRetry = () => {
    setIsRetrying(true);
    validateToken();
  };

  const handleStatusUpdate = useCallback(
    (confirmationResponse: MemberConfirmationSuccessResponse) => {
      // Update member data with the fresh data from the API response
      // The API response should contain the updated member information
      if (confirmationResponse.data.member) {
        setMemberData(confirmationResponse);
      } else {
        // If the response doesn't contain updated member data, refresh from API
        validateToken();
      }
    },
    [validateToken],
  );

  // Loading state
  if (loadingState === "loading") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 rounded-full border-2 border-neutral-200"></div>
            <div className="border-t-primary absolute inset-0 animate-spin rounded-full border-2 border-transparent"></div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-neutral-700">
              {t("validatingToken")}
            </p>
            <p className="mx-auto max-w-md text-sm text-neutral-500">
              {t("validatingDescription")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (loadingState === "error") {
    return (
      <div className="space-y-6">
        <div className="space-y-4 text-center">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-red-100"></div>
            <IconAlertCircle className="relative h-8 w-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-neutral-900">
              {t("errorTitle")}
            </h3>
            <p className="mx-auto max-w-md leading-relaxed text-neutral-600">
              {error}
            </p>
          </div>
        </div>

        <div className="text-center">
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            variant="default"
            size="lg"
            className="min-w-[140px]"
          >
            {isRetrying ? (
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <IconRefresh className="mr-2 h-4 w-4" />
            )}
            {isRetrying ? t("tryingAgain") : t("tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

  // Success state - show member details and appropriate form/message
  if (loadingState === "success" && memberData) {
    const memberStatus = memberData.data.member.confirmation_status;
    const hasAlreadyResponded =
      memberStatus === "confirmed" || memberStatus === "declined";

    return (
      <div className="space-y-8">
        <div className="rounded-xl bg-gradient-to-br from-green-50 to-blue-50 p-1">
          <div className="rounded-lg bg-white shadow-sm">
            <MemberDetailsCard memberData={memberData} />
          </div>
        </div>

        {hasAlreadyResponded ? (
          // Show already responded message
          <div className="rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-100 p-1">
            <div className="rounded-lg bg-white p-8 text-center shadow-sm">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-neutral-900">
                  {t("alreadyResponded.title")}
                </h3>
                <p className="mx-auto max-w-md text-neutral-600">
                  {memberStatus === "confirmed"
                    ? t("alreadyResponded.confirmedMessage")
                    : t("alreadyResponded.declinedMessage")}
                </p>
                <p className="text-sm text-neutral-500">
                  {t("alreadyResponded.thankYou")}
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Show confirmation form for pending members
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 p-1">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <ConfirmationForm
                token={token}
                onStatusUpdate={handleStatusUpdate}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
